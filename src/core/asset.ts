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
   * Builds assets for the `target` context entry.
   *
   * Passes each {@link CxAsset.Evaluator asset evaluator} to the given `collector`, until the latter returns `false`
   * or there are no more assets.
   *
   * @param target - Context entry definition target.
   * @param collector - Asset evaluators collector.
   */
  buildAssets(
      target: CxEntry.Target<TValue, TAsset, TContext>,
      collector: CxAsset.Collector<TAsset>,
  ): void;

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
   * Asset evaluator signature.
   *
   * @typeParam TAsset - Evaluated asset type.
   *
   * @returns Either evaluated asset, or `null`/`undefined` if asset is not available.
   */
  export type Evaluator<TAsset> = (this: void) => TAsset | null | undefined;

  /**
   * A signature of context value {@link CxAsset.buildAssets asset evaluators} collector.
   *
   * @typeParam TAsset - Context value asset type.
   * @param getAsset - Asset evaluator to collect.
   *
   * @returns `false` to stop collecting, or `true`/`void` to continue.
   */
  export type Collector<TAsset> = (this: void, getAsset: Evaluator<TAsset>) => void | boolean;

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
   * A signature of {@link CxAsset.Target.eachAsset assets iteration} callback.
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
   * @param asset - Existing context entry asset provided for context entry most recently, or `undefined` if there are
   * no assets provided.
   */
  export type RecentReceiver<TAsset> = (this: void, asset: Existing<TAsset> | undefined) => void;

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
     * Asset supply.
     *
     * The asset is revoked once cut off.
     */
    readonly supply: Supply;

    /**
     * A rank of the asset modifier it is {@link CxValues.Modifier.provide provided} for.
     *
     * `0` refers to current context modifier, `1` - to its predecessor, etc.
     */
    readonly rank: number;

    /**
     * Evaluates asset.
     *
     * Asset evaluated at most once. All subsequent calls to this method would return the previously evaluated asset.
     *
     * @returns Either evaluated asset, or `null`/`undefined` if asset is not available.
     */
    get(this: void): TAsset | null | undefined;

  }

  /**
   * Existing asset provided for context entry.
   *
   * @typeParam TAsset - Context value asset type.
   */
  export interface Existing<TAsset> extends Provided<TAsset> {

    /**
     * Evaluates asset.
     *
     * @returns Evaluated asset. Never `null` or `undefined`.
     */
    get(this: void): TAsset;

  }

}
