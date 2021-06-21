import { valueProvider } from '@proc7ts/primitives';
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
   * Iterates over assets of the `target` context entry.
   *
   * Each asset evaluator is reported to the given `callback` function until the latter returns `false` or there are
   * no more assets.
   *
   * @param target - Context entry definition target.
   * @param callback - Assets callback.
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
   * A signature of context value {@link CxAsset.each assets iteration} callback.
   *
   * @typeParam TAsset - Context value asset type.
   * @param getAsset - Asset evaluator function.
   *
   * @returns `false` to stop iteration, or `true`/`void` to continue.
   */
  export type Callback<TAsset> = (this: void, getAsset: Evaluator<TAsset>) => void | boolean;

}

function CxAsset$provideNone<TValue, TAsset, TContext extends CxValues>(
    _target: CxEntry.Target<TValue, TAsset, TContext>,
    _receiver: CxAsset.Callback<TAsset>,
): void {
  // No assets.
}

/**
 * Creates constant context entry asset.
 *
 * @typeParam TAsset - Context value asset type.
 * @typeParam TContext - Context type.
 * @param entry - Target context entry.
 * @param value - Constant value asset, or `null`/`undefined` to not provide any assets.
 * @param supply - Asset supply. Remove the created asset once cut off.
 */
export function cxConstAsset<TAsset, TContext extends CxValues = CxValues>(
    entry: CxEntry<unknown, TAsset>,
    value: TAsset | null | undefined,
    supply?: Supply,
): CxAsset<unknown, TAsset, TContext> {
  return {
    entry,
    supply,
    each: value != null
        ? (_target, receiver) => receiver(valueProvider(value))
        : CxAsset$provideNone,
  };
}

/**
 * Creates aliasing context entry asset.
 *
 * @typeParam TAsset - Context value asset type.
 * @typeParam TContext - Context type.
 * @param entry - Target context entry.
 * @param alias - Context entry which value is used as an asset of the `target` entry.
 * @param supply - Asset supply. Remove the created asset once cut off.
 */
export function cxAliasAsset<TAsset, TContext extends CxValues = CxValues>(
    entry: CxEntry<unknown, TAsset>,
    alias: CxEntry<TAsset, unknown>,
    supply?: Supply,
): CxAsset<unknown, TAsset, TContext> {
  return {
    entry,
    supply,
    each(target, receiver) {
      receiver(() => target.get(alias, { or: null }));
    },
  };
}

export function cxBuildAsset<TValue, TAsset = TValue, TContext extends CxValues = CxValues>(
    entry: CxEntry<TValue, TAsset>,
    build: (this: void, target: CxEntry.Target<TValue, TAsset>) => TAsset | null | undefined,
    supply?: Supply,
): CxAsset<TValue, TAsset, TContext> {
  return {
    entry,
    supply,
    each(target, receiver) {
      receiver(() => build(target));
    },
  };
}
