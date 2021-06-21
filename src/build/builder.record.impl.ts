import { valueProvider } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
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

  provide(iterator: CxAsset$Iterator<TValue, TAsset>, supply: Supply): void {
    this._provide(iterator, supply);
  }

  private _provideForAll(iterator: CxAsset$Iterator<TValue, TAsset>, supply: Supply): void {
    this._provide(iterator, supply);

    for (const [supply, [target, receiver]] of this.receivers) {
      if (!supply.isOff) {
        this._trackAssets(target, receiver);
      }
    }
  }

  private _provide(
      iterator: CxAsset$Iterator<TValue, TAsset>,
      supply: Supply,
  ): void {
    this.assets.set(supply, iterator);
    supply.whenOff(() => this.assets.delete(supply));
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

    for (const iterator of this.assets.values()) {
      iterator(target, getAsset => { assets.push(getAsset); });
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
    this.provide = this._provideForAll;
    this.trackAssets = this._trackAssets;

    return this._trackAssets(target, receiver);
  }

  private _trackAssets(
      target: CxEntry.Target<TValue, TAsset>,
      receiver: CxEntry.AssetReceiver<TAsset>,
  ): Supply {

    const trackingSupply: Supply = new Supply(() => this.receivers.delete(trackingSupply));

    this.receivers.set(trackingSupply, [target, receiver]);

    this.builder._initial.trackAssets(
        target,
        (getAsset, supply, rank) => receiver(
            getAsset,
            supply.needs(trackingSupply),
            rank + 1,
        ),
    ).needs(trackingSupply);
    for (const [supply, iterator] of this.assets) {
      iterator(
          target,
          getAsset => {

            const asset = getAsset();

            if (asset != null) {
              receiver(asset, supply.needs(trackingSupply), 0);
            }
          },
      );
    }

    return trackingSupply;
  }

  private define(): CxEntry.Definition<TValue> {

    const { entry, builder } = this;
    const { context } = builder;
    const target: CxEntry.Target<TValue, TAsset, TContext> = {
      context,
      entry,
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
