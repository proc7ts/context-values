import { EventEmitter, EventReceiver, eventReceiver } from '@proc7ts/fun-events';
import { lazyValue, valueProvider } from '@proc7ts/primitives';
import { alwaysSupply, Supply } from '@proc7ts/supply';
import { CxSupply } from '../conventional';
import { CxAsset, CxEntry, CxRequest, CxValues } from '../core';
import { CxBuilder } from './builder';
import { CxReferenceError } from './reference-error';

export type CxAsset$Iterator<TValue, TAsset = TValue> = CxAsset<TValue, TAsset>['each'];

export class CxBuilder$Record<TValue, TAsset, TContext extends CxValues> {

  private readonly assets = new Map<Supply, CxAsset$Iterator<TValue, TAsset>>();
  private readonly senders = new Map<Supply, CxBuilder$AssetSender<TValue, TAsset>>();

  constructor(
      private readonly builder: CxBuilder<TContext>,
      private readonly entry: CxEntry<TValue, TAsset>,
  ) {
  }

  provide(iterator: CxAsset$Iterator<TValue, TAsset>, assetSupply: Supply): void {
    this.assets.set(assetSupply, iterator);
    assetSupply.whenOff(() => this.assets.delete(assetSupply));

    for (const [trackingSupply, sender] of this.senders) {
      this.sendAssets(
          sender,
          iterator,
          new Supply().needs(assetSupply).needs(trackingSupply),
      );
    }
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
      callback: CxEntry.AssetCallback<TAsset>,
  ): void {
    target.supply.whenOff(() => callback = valueProvider(false));

    let goOn: unknown;

    this.builder._initial.eachAsset(
        target,
        getAsset => goOn = callback(getAsset),
    );

    if (goOn !== false) {
      for (const iterator of this.assets.values()) {
        iterator(target, getAsset => {

          const asset = getAsset();

          return goOn = asset == null || callback(asset);
        });
        if (goOn === false) {
          break;
        }
      }
    }
  }

  eachActualAsset(
      target: CxEntry.Target<TValue, TAsset>,
      callback: CxEntry.AssetCallback<TAsset>,
  ): void {

    // Record asset evaluators in the order they are provided.
    const assets: CxAsset.Evaluator<TAsset>[] = [];
    let recordAsset = (getAsset: CxAsset.Evaluator<TAsset>): boolean | void => {
      assets.push(getAsset);
    };

    target.supply.whenOff(() => {
      recordAsset = callback = valueProvider(false);
      assets.length = 0;
    });

    for (const iterator of this.assets.values()) {
      iterator(target, getAsset => recordAsset(getAsset));
    }

    // Iterate in reverse order.
    for (let i = assets.length - 1; i >= 0; --i) {

      const asset = assets[i]();

      if (asset != null && callback(asset) === false) {
        return;
      }
    }

    // Do the same for initial assets.
    this.builder._initial.eachActualAsset(
        target,
        getAsset => callback(getAsset),
    );
  }

  trackAssets(
      target: CxEntry.Target<TValue, TAsset>,
      receiver: EventReceiver<[CxEntry.Asset<TAsset>]>,
  ): Supply {

    const rcv = eventReceiver(receiver);
    const trackingSupply = rcv.supply;
    const emitter = new EventEmitter();

    emitter.supply.needs(target);
    emitter.on(rcv);

    const sender: CxBuilder$AssetSender<TValue, TAsset> = [target, emitter];

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
      [target, emitter]: CxBuilder$AssetSender<TValue, TAsset>,
      iterator: CxAsset$Iterator<TValue, TAsset>,
      supply: Supply,
  ): void {
    if (supply.isOff) {
      return;
    }

    let sendAsset = (getAsset: CxAsset.Evaluator<TAsset>): boolean | void => {
      emitter.send({ supply, rank: 0, get: lazyValue(getAsset) });
    };

    supply.whenOff(() => {
      sendAsset = valueProvider(false);
    });

    iterator(target, getAsset => sendAsset(getAsset));
  }

  private define(): CxEntry.Definition<TValue> {

    const { entry, builder } = this;
    const { context } = builder;
    const getSupply = entry === CxSupply as CxEntry<any>
        ? valueProvider(alwaysSupply())
        : lazyValue(() => new Supply().needs(context.get(CxSupply)));
    const target: CxEntry.Target<TValue, TAsset, TContext> = {
      context,
      entry,
      get supply(): Supply {
        return getSupply();
      },
      get: context.get.bind(context),
      provide: builder.provide.bind(builder),
      eachAsset: callback => this.eachAsset(target, callback),
      eachActualAsset: callback => this.eachActualAsset(target, callback),
      trackAssets: receiver => this.trackAssets(target, receiver),
    };
    const definition = this.entry.perContext(target);

    this.define = valueProvider(definition);

    return definition;
  }

}

type CxBuilder$AssetSender<TValue, TAsset> = readonly [
  target: CxEntry.Target<TValue, TAsset>,
  emitter: EventEmitter<[CxEntry.Asset<TAsset>]>,
];
