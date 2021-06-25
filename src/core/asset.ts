import { Supply } from '@proc7ts/supply';
import { CxEntry } from './entry';
import { CxValues } from './values';

/**
 * Context entry asset.
 *
 * Builds assets for the value of specific context entry.
 *
 * @typeParam TValue - Context value type.
 * @typeParam TAsset - Context value asset type.
 * @typeParam TContext - Context type.
 */
export interface CxAsset<TValue, TAsset = TValue, TContext extends CxValues = CxValues> {

  /**
   * Target context entry.
   */
  readonly entry: CxEntry<TValue, TAsset>;

  /**
   * Evaluates value asset or multiple assets and places them to `target` context entry.
   *
   * Passes each evaluated asset to the given `collector`, until the latter returns `false` or there are no more assets
   * to place.
   *
   * @param target - Context entry definition target.
   * @param collector - Asset collector.
   */
  placeAsset(
      target: CxEntry.Target<TValue, TAsset, TContext>,
      collector: CxAsset.Collector<TAsset>,
  ): void;

  /**
   * Sets up asset.
   *
   * This method is called immediately when asset {@link CxValues.Modifier.provide provided}.
   *
   * It can be used e.g. to provide additional assets. Additional assets will be revoked when the asset itself revoked.
   *
   * @param target - Context entry definition target.
   */
  setupAsset?(target: CxEntry.Target<TValue, TAsset, TContext>): void;

  /**
   * Asset supply.
   *
   * Removes the asset once cut off.
   *
   * Returned from {@link CxValues.Modifier.provide} when specified. New one created when omitted.
   */
  readonly supply?: Supply;

}

export namespace CxAsset {

  /**
   * Context value asset placeholder.
   *
   * A placeholder could be {@link CxAsset.placeAsset placed} instead of the value asset. In this case it will be used
   * to evaluate and place assets instead.
   *
   * @typeParam TAsset - Context value asset type.
   */
  export interface Placeholder<TAsset> {

    /**
     * Evaluates value asset or multiple assets and places them to `target` context entry.
     *
     * @param target - Context entry definition target.
     * @param callback - Asset placement callback.
     */
    placeAsset(target: CxEntry.Target<unknown, TAsset>, callback: Callback<TAsset>): void;

  }

  /**
   * A signature of context value asset collector.
   *
   * The {@link CxAsset.placeAsset} method passes evaluated assets to it.
   *
   * @typeParam TAsset - Context value asset type.
   * @param asset - Either asset instance to collect, or its resolver.
   *
   * @returns `false` to stop collecting, or `true`/`void` to continue.
   */
  export type Collector<TAsset> = (this: void, asset: TAsset | Placeholder<TAsset>) => void | boolean;

  /**
   * An updater of context entry value with asset.
   *
   * It is notified on every asset change and responsible for entry value evaluation based on this asset.
   *
   * @typeParam TValue - Context value type.
   * @typeParam TAsset - Context value asset type.
   */
  export interface Updater<TValue, TAsset = TValue> {

    /**
     * Evaluates context value.
     *
     * @returns Context value.
     */
    get(): TValue;

    /**
     * Updates context value based on asset.
     *
     * @param asset - Updated asset.
     */
    set(asset: TAsset): void;

    /**
     * Resets context value when asset is no longer available.
     */
    reset(): void;

  }

  /**
   * A signature of {@link CxEntry.Target.eachAsset assets iteration} callback.
   *
   * @typeParam TAsset - Context value asset type.
   * @param asset - Current asset.
   *
   * @returns `false` to stop iteration, or `true`/`void` to continue.
   */
  export type Callback<TAsset> = (this: void, asset: TAsset) => void | boolean;

  /**
   * A signature of receiver of assets provided for context entry.
   *
   * @typeParam TAsset - Context value asset type.
   * @param asset - An asset provided for context entry.
   */
  export type Receiver<TAsset> = (this: void, asset: Provided<TAsset>) => void;

  /**
   * A signature of the receiver of the most recent asset provided for context entry.
   *
   * @typeParam TAsset - Context value asset type.
   * @param asset - Evaluated context entry asset provided for context entry most recently, or `undefined` if there are
   * no assets provided.
   */
  export type RecentReceiver<TAsset> = (this: void, asset: Evaluated<TAsset> | undefined) => void;

  /**
   * A signature of receiver of asset list provided for context entry.
   *
   * @typeParam TAsset - Context value asset type.
   * @param assets - Array of assets provided for context entry.
   */
  export type ListReceiver<TAsset> = (this: void, assets: Provided<TAsset>[]) => void;

  /**
   * An asset provided for context entry.
   *
   * @typeParam TAsset - Context value asset type.
   */
  export interface Provided<TAsset> {

    /**
     * A rank of the asset modifier it is {@link CxValues.Modifier.provide provided} for.
     *
     * `0` refers to current context modifier, `1` - to its predecessor, etc.
     */
    readonly rank: number;

    /**
     * Asset supply.
     *
     * The asset is revoked once cut off.
     */
    readonly supply: Supply;

    /**
     * The most recent asset evaluated by this entry asset.
     *
     * `undefined` when no value assets provided by this entry asset.
     */
    readonly recentAsset: Evaluated<TAsset> | undefined;

    /**
     * Iterates over value assets in the same order they are provided by this entry asset.
     *
     * Passes each asset to the given `callback` function, until the latter returns `false` or there are no more
     * assets.
     *
     * @param callback - Assets callback.
     */
    eachAsset(callback: CxAsset.Callback<TAsset>): void;

    /**
     * Iterates over value assets with the most recent assets iterated first. I.e. in reverse order to the order they
     * are provided by this entry asset.
     *
     * Passes each asset to the given `callback` function until the latter returns `false` or there are no more assets.
     *
     * @param callback - Assets callback.
     */
    eachRecentAsset(callback: CxAsset.Callback<TAsset>): void;

  }

  /**
   * Evaluated asset provided for context entry.
   *
   * @typeParam TAsset - Context value asset type.
   */
  export interface Evaluated<TAsset> {

    /**
     * Evaluated value asset.
     */
    readonly asset: TAsset;

    /**
     * A rank of the asset modifier it is {@link CxValues.Modifier.provide provided} for.
     *
     * `0` refers to current context modifier, `1` - to its predecessor, etc.
     */
    readonly rank: number;

    /**
     * Asset supply.
     *
     * The asset is revoked once cut off.
     */
    readonly supply: Supply;

  }

}
