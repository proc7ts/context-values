import { lazyValue } from '@proc7ts/primitives';
import { neverSupply, Supply } from '@proc7ts/supply';
import { CxAsset } from './asset';
import { CxBuilder$Record } from './builder.record.impl';
import { CxEntry } from './entry';
import { CxRequest } from './request';
import { CxValues } from './values';

const CxBuilder$noAssets: CxBuilder.AssetSource = {

  eachAsset<TValue, TAsset>(
      _target: CxEntry.Target<TValue, TAsset>,
      _receiver: CxEntry.AssetReceiver<TAsset>,
  ): void {
    // No assets to iterate.
  },

  eachActualAsset<TValue, TAsset>(
      _target: CxEntry.Target<TValue, TAsset>,
      _receiver: CxEntry.AssetReceiver<TAsset>,
  ): void {
    // No assets to iterate.
  },

  trackAssets<TValue, TAsset>(
      _target: CxEntry.Target<TValue, TAsset>,
      _receiver: CxEntry.AssetReceiver<TAsset>,
  ): Supply {
    return neverSupply();
  },

};

/**
 * Context builder.
 *
 * Provides value assets for the context.
 */
export class CxBuilder<TContext extends CxValues = CxValues>
    implements CxValues.Modifier<TContext>, CxValues.Accessor, CxBuilder.AssetSource {

  /**
   * @internal
   */
  private readonly _cx: () => TContext;

  /**
   * @internal
   */
  private readonly _records = new Map<CxEntry<any, any>, CxBuilder$Record<any, any, TContext>>();

  /**
   * @internal
   */
  readonly _initial: CxBuilder.AssetSource;

  /**
   * Constructs context builder.
   *
   * @param createContext - Context creator function. Accepts context value getter as its only parameter and returns
   * created context.
   * @param initial - Initial context value assets provider. These assets applies before the ones provided
   * {@link provide explicitly}.
   */
  constructor(
      createContext: (this: void, getValue: CxValues.Getter) => TContext,
      initial: CxBuilder.AssetSource = CxBuilder$noAssets,
  ) {
    this._cx = lazyValue(() => createContext(
        (entry, request) => this.get(entry, request),
    ));
    this._initial = initial;
  }

  /**
   * Modified context.
   */
  get context(): TContext {
    return this._cx();
  }

  get<TValue>(entry: CxEntry<TValue, any>, request?: CxRequest.WithFallback<TValue>): TValue;

  get<TValue>(entry: CxEntry<TValue, any>, request?: CxRequest<TValue>): TValue | null;

  get<TValue>(entry: CxEntry<TValue, any>, request?: CxRequest<TValue>): TValue | null {
    return this._record(entry).get(request);
  }

  provide<TValue, TAsset = TValue>(asset: CxAsset<TValue, TAsset, TContext>): Supply {

    const { entry, supply = new Supply() } = asset;

    this._record(entry).provide(asset.each, supply);

    return supply;
  }

  eachAsset<TValue, TAsset>(
      target: CxEntry.Target<TValue, TAsset>,
      callback: CxEntry.AssetCallback<TAsset>,
  ): void {
    this._record(target.entry).eachAsset(target, callback);
  }

  eachActualAsset<TValue, TAsset>(
      target: CxEntry.Target<TValue, TAsset>,
      callback: CxEntry.AssetCallback<TAsset>,
  ): void {
    this._record(target.entry).eachActualAsset(target, callback);
  }

  trackAssets<TValue, TAsset>(
      target: CxEntry.Target<TValue, TAsset>,
      receiver: CxEntry.AssetReceiver<TAsset>,
  ): Supply {
    return this._record(target.entry).trackAssets(target, receiver);
  }

  private _record<TValue, TAsset>(entry: CxEntry<TValue, TAsset>): CxBuilder$Record<TValue, TAsset, TContext> {

    let record: CxBuilder$Record<TValue, TAsset, TContext> | undefined = this._records.get(entry);

    if (!record) {
      this._records.set(entry, record = new CxBuilder$Record(this, entry));
    }

    return record;
  }

}

export namespace CxBuilder {

  /**
   * A source of assets to apply before the ones provided by {@link CxBuilder context builder}.
   */
  export interface AssetSource {

    /**
     * Iterates over particular entry assets in the same order they are provided.
     *
     * Each asset reported to the given `callback` function until the latter returns `false` or there are no more
     * assets.
     *
     * @param target - Context entry definition target to iterate over assets of.
     * @param callback - Assets callback.
     */
    eachAsset<TValue, TAsset>(
        target: CxEntry.Target<TValue, TAsset>,
        callback: CxEntry.AssetCallback<TAsset>,
    ): void;

    /**
     * Iterates over particular entry assets with the most actual assets iterated first. I.e. in reverse order to the
     * order they are provided.
     *
     * Each asset reported to the given `callback` function until the latter returns `false` or there are no more
     * assets.
     *
     * @param target - Context entry definition target to iterate over assets of.
     * @param callback - Assets callback.
     */
    eachActualAsset<TValue, TAsset>(
        target: CxEntry.Target<TValue, TAsset>,
        callback: CxEntry.AssetCallback<TAsset>,
    ): void;

    /**
     * Reads assets of particular entry value and start tracking of their additions.
     *
     * @param target - Context entry definition target to track assets for.
     * @param receiver - A receiver to report existing and added assets to.
     *
     * @returns Assets supply. Stops assets tracking once cut off.
     */
    trackAssets<TValue, TAsset>(
        target: CxEntry.Target<TValue, TAsset>,
        receiver: CxEntry.AssetReceiver<TAsset>,
    ): Supply;

  }

}
