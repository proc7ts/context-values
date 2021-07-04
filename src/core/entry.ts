import { Supply, SupplyPeer } from '@proc7ts/supply';
import { CxAsset } from './asset';
import { CxModifier } from './modifier';
import { CxRequest } from './request';
import { CxRequestMethod } from './request-method';
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

  toString?(): string;

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
      > extends CxValues, CxModifier<TContext>, SupplyPeer {

    /**
     * Context entry to define.
     */
    readonly entry: CxEntry<TValue, TAsset>;

    /**
     * Entry value supply.
     *
     * The assets won't be provided any more when cut off. If applicable, disables the entry value.
     *
     * This entry depends on context values supply.
     */
    readonly supply: Supply;

    /**
     * The most recent asset provided for the entry.
     *
     * `undefined` when no assets provided.
     */
    readonly recentAsset: TAsset | undefined;

    /**
     * Iterates over value assets in the same order they are provided.
     *
     * Passes each asset to the given `callback` function, until the latter returns `false` or there are no more
     * assets.
     *
     * @param callback - Assets callback.
     */
    eachAsset(callback: CxAsset.Callback<TAsset>): void;

    /**
     * Iterates over value assets with the most recent assets iterated first. I.e. in reverse order to the order they
     * are provided.
     *
     * Passes each asset to the given `callback` function until the latter returns `false` or there are no more assets.
     *
     * @param callback - Assets callback.
     */
    eachRecentAsset(callback: CxAsset.Callback<TAsset>): void;

    /**
     * Reads entry assets and start tracking of their additions.
     *
     * Sends already provided assets to the given `receiver`, then sends every added assets too, until the returned
     * asset supply cut off.
     *
     * @param receiver - Assets receiver.
     *
     * @returns Assets supply. Stops tracking once cut off.
     */
    trackAssets(receiver: CxAsset.Receiver<TAsset>, { supply }?: { readonly supply: Supply }): Supply;

    /**
     * Reads the most recent entry asset and starts its tracking.
     *
     * The most recent asset is the one with the smallest {@link CxAsset.Provided.rank rank} provided last.
     *
     * Sends the recent asset to the given `receiver`, then sends again whenever the recent asset changes. Sends
     * `undefined` when there are no assets provided for the entry.
     *
     * @param receiver - Most recent asset receiver.
     *
     * @returns Most recent assets supply. Stops tracking once cut off.
     */
    trackRecentAsset(receiver: CxAsset.RecentReceiver<TAsset>): Supply;

    /**
     * Reads entry assets list and start tracking of their additions.
     *
     * Sends a list of already provided assets to the given `receiver`, then sends it again on whenever asset provided
     * or revoked, until the returned asset supply cut off.
     *
     * @param receiver - Assets list receiver.
     *
     * @returns Assets list supply. Stops tracking once cut off.
     */
    trackAssetList(receiver: CxAsset.ListReceiver<TAsset>): Supply;

    /**
     * Creates a lazy evaluator against `this` entry definition target instance.
     *
     * @typeParam T - Evaluation result type.
     * @param evaluator - Evaluator function accepting `this` entry definition target instance as its only parameter
     * and returning some result.
     *
     * @returns A function without parameters returning the evaluated result. The result will be evaluated at most once.
     */
    lazy<T>(evaluator: (this: void, target: this) => T): (this: void) => T;

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
     * Assigns context entry value {@link CxModifier.provide provided} by its assets.
     *
     * When defined, this method is tried first when accessing the context entry value.
     *
     * If the value is not assigned by this method call, the {@link CxRequest.or fallback} value is used. If the latter
     * is not available, the {@link assignDefault default value} is used instead.
     *
     * @param assigner - Entry value assigner to call if the value is available.
     * @param request - Original context value {@link CxValues.get request}.
     */
    assign?(assigner: Assigner<TValue>, request: CxRequest<TValue>): void;

    /**
     * Assigns the default context entry value.
     *
     * When defined, this method is tried if there is no {@link assign value} available for the entry, and no
     * {@link CxRequest.or fallback} provided.
     *
     * @param assigner - Entry value assigner to call if the value is available.
     * @param request - Original context value {@link CxValues.get request}.
     */
    assignDefault?(assigner: Assigner<TValue>, request: CxRequest<TValue>): void;

  }

  /**
   * Context value assigner signature.
   *
   * Called to {@link Definition.assign} context value.
   *
   * @typeParam TValue - Context value type.
   * @param value - Assigned entry value.
   * @param by - Optional request method the value is obtained by. By default, depends on {@link Definition entry
   * definition} method the assigner passed to.
   */
  export type Assigner<TValue> = (this: void, value: TValue, by?: CxRequestMethod) => void;

}
