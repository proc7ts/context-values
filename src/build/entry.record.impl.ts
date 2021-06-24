import { EventEmitter, EventReceiver, eventReceiver } from '@proc7ts/fun-events';
import { lazyValue, valueProvider } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { CxAsset, CxEntry, CxRequest, CxValues } from '../core';
import { CxBuilder } from './builder';
import { CxEntry$Target } from './entry.target.impl';
import { CxReferenceError } from './reference-error';

export class CxEntry$Record<TValue, TAsset, TContext extends CxValues> {

  private readonly define: () => CxEntry.Definition<TValue>;
  private readonly assets = new Map<Supply, CxAsset<TValue, TAsset>>();
  private readonly senders = new Map<Supply, CxEntry$AssetSender<TValue, TAsset>>();

  constructor(
      readonly builder: CxBuilder<TContext>,
      readonly entry: CxEntry<TValue, TAsset>,
  ) {
    this.define = lazyValue(() => entry.perContext(new CxEntry$Target(this)));
  }

  provide(asset: CxAsset<TValue, TAsset>): Supply {

    const { supply = new Supply() } = asset;

    this.assets.set(supply, asset);
    supply.whenOff(() => this.assets.delete(supply));

    for (const [trackingSupply, sender] of this.senders) {
      this.sendAssets(
          sender,
          asset,
          new Supply().needs(supply).needs(trackingSupply),
      );
    }

    return supply;
  }

  get({ or }: CxRequest<TValue> = {}): TValue | null {

    const definition = this.define();
    const value = definition.get?.();

    if (value != null) {
      return value;
    }
    if (or !== undefined) {
      return or;
    }

    const defaultValue = definition.getDefault?.();

    if (defaultValue != null) {
      return defaultValue;
    }

    throw new CxReferenceError(this.entry);
  }

  eachAsset(
      target: CxEntry.Target<TValue, TAsset>,
      callback: CxAsset.Callback<TAsset>,
  ): void {
    if (target.supply.isOff) {
      return;
    }

    const cb: CxAsset.Callback<TAsset> = asset => !target.supply.isOff
        && callback(asset) !== false
        && !target.supply.isOff;
    let goOn: unknown;

    this.builder._initial.eachAsset(
        target,
        getAsset => goOn = cb(getAsset),
    );

    if (goOn !== false) {
      for (const asset of this.assets.values()) {
        asset.buildAssets(target, getAsset => {

          const assetValue = getAsset();

          return goOn = assetValue == null || cb(assetValue);
        });
        if (goOn === false) {
          break;
        }
      }
    }
  }

  eachRecentAsset(
      target: CxEntry.Target<TValue, TAsset>,
      callback: CxAsset.Callback<TAsset>,
  ): void {
    if (target.supply.isOff) {
      return;
    }

    // Record asset evaluators in the order they are provided.
    const assets: CxAsset.Evaluator<TAsset>[] = [];

    for (const asset of this.assets.values()) {
      asset.buildAssets(target, (getAsset: CxAsset.Evaluator<TAsset>): boolean | void => {
        if (target.supply.isOff) {
          assets.length = 0;
          return false;
        }
        assets.push(getAsset);
      });
    }

    // Iterate in reverse order.
    const cb: CxAsset.Callback<TAsset> = asset => !target.supply.isOff
        && callback(asset) !== false
        && !target.supply.isOff;

    for (let i = assets.length - 1; i >= 0; --i) {

      const asset = assets[i]();

      if (asset != null && cb(asset) === false) {
        return;
      }
    }

    // Do the same for initial assets.
    this.builder._initial.eachRecentAsset(target, cb);
  }

  trackAssets(
      target: CxEntry.Target<TValue, TAsset>,
      receiver: EventReceiver<[CxAsset.Provided<TAsset>]>,
  ): Supply {

    const rcv = eventReceiver(receiver);
    const trackingSupply = rcv.supply;
    const emitter = new EventEmitter();

    emitter.supply.needs(target);
    emitter.on(rcv);

    const sender: CxEntry$AssetSender<TValue, TAsset> = [target, emitter];

    this.senders.set(trackingSupply, sender);
    trackingSupply.whenOff(() => this.senders.delete(trackingSupply));

    this.builder._initial.trackAssets(
        target,
        {
          supply: trackingSupply,
          receive: (ecx, { supply, rank, get }) => rcv.receive(
              ecx,
              {
                supply,
                rank: rank + 1,
                get,
              },
          ),
        },
    ).needs(trackingSupply);

    for (const [assetSupply, iterator] of this.assets) {
      this.sendAssets(
          sender,
          iterator,
          new Supply().needs(assetSupply).needs(trackingSupply),
      );
    }

    return trackingSupply;
  }

  private sendAssets(
      [target, emitter]: CxEntry$AssetSender<TValue, TAsset>,
      asset: CxAsset<TValue, TAsset>,
      supply: Supply,
  ): void {

    let sendAsset = (getAsset: CxAsset.Evaluator<TAsset>): boolean | void => {
      emitter.send({ supply, rank: 0, get: lazyValue(getAsset) });
    };

    supply.whenOff(() => {
      sendAsset = valueProvider(false);
    });

    asset.buildAssets(target, getAsset => sendAsset(getAsset));
  }

}

type CxEntry$AssetSender<TValue, TAsset> = readonly [
  target: CxEntry.Target<TValue, TAsset>,
  emitter: EventEmitter<[CxAsset.Provided<TAsset>]>,
];
