import { Supply } from '@proc7ts/supply';
import { CxEntry } from './entry';
import { CxValues } from './values';

/**
 * Context entry asset.
 *
 * Used to provide assets of the value of specific context entry.
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
   * Asset supply.
   *
   * Removes the asset once cut off.
   *
   * Returned from {@link CxValues.Modifier.provide} when specified. New one created when omitted.
   */
  readonly supply?: Supply;

  /**
   * Iterates over {@link CxAsset.Evaluator asset evaluators} of the `target` context entry.
   *
   * Passes each asset evaluator to the given `callback` function, until the latter returns `false` or there are no more
   * assets.
   *
   * @param target - Context entry definition target.
   * @param callback - Asset evaluators iteration callback.
   */
  each(
      this: void,
      target: CxEntry.Target<TValue, TAsset, TContext>,
      callback: CxAsset.Callback<TAsset>,
  ): void;

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
   * A signature of context value {@link CxAsset.each asset evaluators iteration} callback.
   *
   * @typeParam TAsset - Context value asset type.
   * @param getAsset - Asset evaluator.
   *
   * @returns `false` to stop iteration, or `true`/`void` to continue.
   */
  export type Callback<TAsset> = (this: void, getAsset: Evaluator<TAsset>) => void | boolean;

  /**
   * An updater of context value asset.
   *
   * It is notified on every asset change, and responsible for entry value evaluation based on its asset.
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
     * Resets context value when it no longer has any assets.
     */
    reset(): void;

  }

}
