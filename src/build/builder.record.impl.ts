import { lazyValue, noop, valueProvider } from '@proc7ts/primitives';
import { alwaysSupply, Supply } from '@proc7ts/supply';
import { CxSupply } from '../conventional';
import { CxAsset, CxEntry, CxRequest, CxValues } from '../core';
import { CxBuilder } from './builder';
import { CxReferenceError } from './reference-error';

export type CxAsset$Iterator<TValue, TAsset = TValue> = CxAsset<TValue, TAsset>['each'];

export class CxBuilder$Record<TValue, TAsset, TContext extends CxValues> {

  private readonly assets = new Map<Supply, CxAsset$Iterator<TValue, TAsset>>();
  private readonly receivers = new Map<Supply, [CxEntry.Target<TValue, TAsset>, CxEntry.AssetReceiver<TAsset>]>();

  constructor(
      private readonly builder: CxBuilder<TContext>,
      private readonly entry: CxEntry<TValue, TAsset>,
  ) {
  }

  provide(iterator: CxAsset$Iterator<TValue, TAsset>, assetSupply: Supply): void {
    this.assets.set(assetSupply, iterator);
    assetSupply.whenOff(() => this.assets.delete(assetSupply));

    for (const [trackingSupply, [target, receiver]] of this.receivers) {
      this.sendToReceiver(
          target,
          iterator,
          new Supply().needs(assetSupply).needs(trackingSupply),
          receiver,
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
      receiver: CxEntry.AssetReceiver<TAsset>,
  ): Supply {

    const trackingSupply: Supply = new Supply().needs(target.supply);

    if (trackingSupply.isOff) {
      return trackingSupply;
    }

    this.receivers.set(trackingSupply, [target, receiver]);
    trackingSupply.whenOff(() => this.receivers.delete(trackingSupply));

    this.builder._initial.trackAssets(
        target,
        ({ supply, rank, get }) => receiver({
          supply,
          rank: rank + 1,
          get,
        }),
    ).needs(trackingSupply);

    for (const [assetSupply, iterator] of this.assets) {
      this.sendToReceiver(
          target,
          iterator,
          new Supply().needs(assetSupply).needs(trackingSupply),
          receiver,
      );
    }

    return trackingSupply;
  }

  private sendToReceiver(
      target: CxEntry.Target<TValue, TAsset>,
      iterator: CxAsset$Iterator<TValue, TAsset>,
      supply: Supply,
      receiver: CxEntry.AssetReceiver<TAsset>,
  ): void {
    if (supply.isOff) {
      return;
    }

    let sendAsset = (getAsset: CxAsset.Evaluator<TAsset>): boolean | void => {
      receiver({ supply, rank: 0, get: lazyValue(getAsset) });
    };

    supply.whenOff(() => {
      receiver = noop;
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
