import { Supply } from '@proc7ts/supply';
import { CxEntry } from './entry';
import { CxTracking } from './tracking';
import { CxValues } from './values';

/**
 * Context entry asset.
 *
 * Provides assets for the value of specific context entry.
 *
 * @typeParam TValue - Context value type.
 * @typeParam TAsset - Context value asset type.
 * @typeParam TContext - Context type.
 */
export type CxAsset<TValue, TAsset = TValue, TContext extends CxValues = CxValues> =
  | CxAsset.Placer<TValue, TAsset, TContext>
  | CxAsset.Builder<TValue, TAsset, TContext>
  | CxAsset.Setup<TValue, TAsset, TContext>;

export namespace CxAsset {
  /**
   * Base interface of context entry asset implementations.
   *
   * @typeParam TValue - Context value type.
   * @typeParam TAsset - Context value asset type.
   * @typeParam TContext - Context type.
   */
  export interface Base<TValue, TAsset, TContext extends CxValues> {
    /**
     * Target context entry.
     */
    readonly entry: CxEntry<TValue, TAsset>;

    /**
     * Asset supply.
     *
     * Removes the asset once cut off.
     *
     * Returned from {@link CxModifier.provide} when specified. New one created when omitted.
     */
    readonly supply?: Supply | undefined;

    /**
     * Evaluates value asset or multiple assets and places them to `target` context entry.
     *
     * Passes each evaluated asset to the given `collector`, until the latter returns `false` or there are no more
     * assets to place.
     *
     * This method is called each time value assets requested.
     *
     * @param target - Context entry definition target.
     * @param collector - Assets collector to place assets to.
     */
    placeAsset?(
      target: CxEntry.Target<TValue, TAsset, TContext>,
      collector: CxAsset.Collector<TAsset>,
    ): void;

    /**
     * Builds value asset provider. The provider would then place value assets to the `target` context entry.
     *
     * In contrast to {@link placeAsset}, this method is called at most once per context. If provider will be
     * called each time value assets requested.
     *
     * This method also supports updatable assets. For that, an `update` function is passed as second parameter. Call it
     * to inform the interested parties on value asset update. The updated asset has to be provided by provider returned
     * earlier.
     *
     * @param target - Context entry definition target.
     * @param update - A function to call when asset updated.
     *
     * @returns Value assets provider accepting assets collector to place assets to as its only parameter, or
     * falsy value if there are no value assets.
     */
    buildAsset?(
      target: CxEntry.Target<TValue, TAsset, TContext>,
      update: (this: void) => void,
    ): ((this: void, collector: Collector<TAsset>) => void) | false | null | undefined;

    /**
     * Sets up asset.
     *
     * This method is called immediately when asset {@link CxModifier.provide provided}.
     *
     * It can be used e.g. to provide additional assets. Additional assets will be revoked when the asset itself
     * revoked.
     *
     * @param target - Context entry definition target.
     */
    setupAsset?(target: CxEntry.Target<TValue, TAsset, TContext>): void;
  }

  /**
   * Context entry asset placer.
   *
   * Places assets for the value of specific context entry.
   *
   * @typeParam TValue - Context value type.
   * @typeParam TAsset - Context value asset type.
   * @typeParam TContext - Context type.
   */
  export interface Placer<TValue, TAsset = TValue, TContext extends CxValues = CxValues>
    extends Base<TValue, TAsset, TContext> {
    placeAsset(
      target: CxEntry.Target<TValue, TAsset, TContext>,
      collector: CxAsset.Collector<TAsset>,
    ): void;

    /* Ignored when {@link placeAsset} defined. */
    readonly buildAsset?: undefined;
  }

  /**
   * Context entry asset builder.
   *
   * Builds a provider of assets for the value of specific context entry.
   *
   * @typeParam TValue - Context value type.
   * @typeParam TAsset - Context value asset type.
   * @typeParam TContext - Context type.
   */
  export interface Builder<TValue, TAsset = TValue, TContext extends CxValues = CxValues>
    extends Base<TValue, TAsset, TContext> {
    /** Ignored when {@link buildAsset} defined. */
    readonly placeAsset?: undefined;

    buildAsset(
      target: CxEntry.Target<TValue, TAsset, TContext>,
      update: (this: void) => void,
    ): ((this: void, collector: Collector<TAsset>) => void) | false | null | undefined;
  }

  /**
   * Context entry asset builder.
   *
   * Only sets up an asset.
   *
   * @typeParam TValue - Context value type.
   * @typeParam TAsset - Context value asset type.
   * @typeParam TContext - Context type.
   */
  export interface Setup<TValue, TAsset = TValue, TContext extends CxValues = CxValues>
    extends Base<TValue, TAsset, TContext> {
    /** {@link setupAsset} is required when both {@link placeAsset} and {@link buildAsset} missing. */
    readonly placeAsset?: undefined;

    /** {@link setupAsset} is required when both {@link placeAsset} and {@link buildAsset} missing. */
    readonly buildAsset?: undefined;

    setupAsset(target: CxEntry.Target<TValue, TAsset, TContext>): void;
  }

  /**
   * A signature of context value assets collector.
   *
   * The {@link CxAsset.placeAsset} method passes evaluated assets to it.
   *
   * @typeParam TAsset - Context value asset type.
   * @param asset - Asset to collect.
   *
   * @returns `false` to stop collecting, or `true`/`void` to continue.
   */
  export type Collector<TAsset> = (this: void, asset: TAsset) => void | boolean;

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
     * A rank of context peer this asset is provided by.
     *
     * `0` refers to current context builder, `1` - to the peer it derives, etc.
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

    /**
     * Starts tracing for this asset updates.
     *
     * Whenever this asset is {@link CxAsset.Base.buildAsset updated}, the registered receiver will be notified, until
     * updates supply cut off.
     *
     * @param receiver - A no-op receiver function to call on every asset update.
     * @param tracking - Updates tracking options.
     *
     * @returns Updates supply. Stops updates tracking once cut off. Cut off immediately if this asset is not updatable.
     */
    onUpdate(receiver: (this: void) => void, tracking?: CxTracking): Supply;
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
     * A rank of the asset modifier it is {@link CxModifier.provide provided} for.
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
