import { Supply, SupplyPeer } from '@proc7ts/supply';
import { CxValues } from './values';

/**
 * Context entry serves as a unique value key withing context.
 *
 * It also responsible for building the value based of its assets.
 *
 * @typeParam TValue - Context value type.
 * @typeParam TAsset - Context value asset type.
 */
export interface CxEntry<TValue, TAsset = TValue> {

  /**
   * Starts the definition of context entry.
   *
   * This is the only method to be implemented by context entry.
   *
   * @param target - Definition target.
   *
   * @returns New context entry definition instance.
   */
  perContext(target: CxEntry.Target<TValue, TAsset>): CxEntry.Definition<TValue>;

}

export namespace CxEntry {

  /**
   * Context entry definer signature.
   *
   * Starts the definition of context entry.
   *
   * This is the only method to be implemented by context entry.
   *
   * @typeParam TValue - Context value type.
   * @typeParam TAsset - Context value asset type.
   * @param target - Definition target.
   *
   * @returns New context entry definition instance.
   */
  export type Definer<TValue, TAsset = TValue> =
      (this: void, target: CxEntry.Target<TValue, TAsset>) => Definition<TValue>;

  /**
   * Context entry definition target.
   *
   * Passed to {@link CxEntry.perContext context entry} to start the definition.
   *
   * Allows to access context values and provide assets for them.
   *
   * @typeParam TValue - Context value type.
   * @typeParam TAsset - Context value asset type.
   */
  export interface Target<
      TValue,
      TAsset = TValue,
      TContext extends CxValues = CxValues
      > extends CxValues.Accessor, CxValues.Modifier<TContext>, SupplyPeer {

    /**
     * Context entry to define.
     */
    readonly entry: CxEntry<TValue, TAsset>;

    /**
     * Entry value supply.
     *
     * The assets won't be provided any more when cut off. If applicable, disables the entry value.
     *
     * This entry depends on {@link CxSupply context values supply}.
     */
    readonly supply: Supply;

    /**
     * Iterates over value assets in the same order they are provided.
     *
     * Passes each asset to the given `callback` function, until the latter returns `false` or there are no more
     * assets.
     *
     * @param callback - Assets callback.
     */
    eachAsset(callback: AssetCallback<TAsset>): void;

    /**
     * Iterates over value assets with the most actual assets iterated first. I.e. in reverse order to the order they
     * are provided.
     *
     * Passes each asset to the given `callback` function until the latter returns `false` or there are no more assets.
     *
     * @param callback - Assets callback.
     */
    eachActualAsset(callback: AssetCallback<TAsset>): void;

    /**
     * Reads entry value assets and start tracking of their additions.
     *
     * Passes already provided assets to the given `receiver` function, then passes every added assets too, until
     * the returned asset supply cut off.
     *
     * @param receiver - Assets receiver.
     *
     * @returns Assets supply. Stops assets tracking once cut off.
     */
    trackAssets(receiver: AssetReceiver<TAsset>): Supply;

  }

  /**
   * Context entry definition.
   *
   * The entry is defined based on value assets available via {@link Target definition target}.
   *
   * The definition is {@link CxEntry.perContext started} for context entry at most once per context.
   *
   * @typeParam TValue - Context value type.
   */
  export interface Definition<TValue> {

    /**
     * Returns context entry value.
     *
     * When defined, this method is tried first when accessing the context entry value.
     *
     * When not defined or `null`/`undefined` returned, the {@link CxRequest.or fallback} value is used. If the latter
     * is not available, the {@link getDefault default value} is used instead.
     *
     * @returns Either entry value, or `null`/`undefined` if the value is not available.
     */
    get?(): TValue | null | undefined;

    /**
     * Returns the default context entry value.
     *
     * When defined, this method is tried if there is no {@link get value} available for the entry, and no
     * {@link CxRequest.or fallback} provided.
     *
     * @returns Either default value for the entry, or `null`/`undefined` if the default value is not available.
     */
    getDefault?(): TValue | null | undefined;

  }

  /**
   * A signature of {@link Target.eachAsset assets iteration} callback.
   *
   * @typeParam TAsset - Context value asset type.
   * @param asset - Current asset.
   *
   * @returns `false` to stop iteration, or `true`/`void` to continue.
   */
  export type AssetCallback<TAsset> = (this: void, asset: TAsset) => void | boolean;

  /**
   * A signature of receiver of new context value assets.
   *
   * Used to {@link Target.trackAssets track} entry value assets.
   *
   * @typeParam TAsset - Context value asset type.
   * @param newAsset - New asset added to context entry.
   */
  export type AssetReceiver<TAsset> = (this: void, newAsset: NewAsset<TAsset>) => void;

  /**
   * New asset added to context entry.
   *
   * @typeParam TAsset - Context value asset type.
   */
  export interface NewAsset<TAsset> {

    /**
     * Asset supply.
     *
     * The asset is revoked once cut off.
     */
    readonly supply: Supply;

    /**
     * A rank of the asset modifier the asset is {@link CxValues.Modifier.provide provided} for.
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

}
