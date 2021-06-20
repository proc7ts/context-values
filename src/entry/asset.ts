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
   * Reads assets for the value of the `target` context entry and reports them to the given `receiver`.
   *
   * @param target - Context entry definition target.
   * @param receiver - Value assets receiver.
   */
  read(
      this: void,
      target: CxEntry.Target<TValue, TAsset, TContext>,
      receiver: CxAsset.Receiver<TAsset>,
  ): void;

}

export namespace CxAsset {

  /**
   * Context value assets provider signature.
   *
   * Provides assets for the value of the `target` context entry to the given `receiver`.
   *
   * @typeParam TValue - Context value type.
   * @typeParam TAsset - Context value asset type.
   * @typeParam TContext - Context type.
   * @param target - Context entry definition target.
   * @param receiver - Value assets receiver.
   */
  export type Provider<TValue, TAsset = TValue, TContext extends CxValues = CxValues> = (
      this: void,
      target: CxEntry.Target<TValue, TAsset, TContext>,
      receiver: Receiver<TAsset>,
  ) => void;

  /**
   * Asset evaluator signature.
   *
   * @typeParam TAsset - Evaluated asset type.
   *
   * @returns Either evaluated asset, or `null`/`undefined` if asset is not available.
   */
  export type Evaluator<TAsset> = (this: void) => TAsset | null | undefined;

  /**
   * Context value assets receiver.
   *
   * @typeParam TAsset - Context value asset type.
   * @param getAsset - Asset evaluator function.
   */
  export type Receiver<TAsset> = (this: void, getAsset: Evaluator<TAsset>) => void;

}

function CxAsset$provideNone<TValue, TAsset, TContext extends CxValues>(
    _target: CxEntry.Target<TValue, TAsset, TContext>,
    _receiver: CxAsset.Receiver<TAsset>,
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
    read: value != null
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
    read(target, receiver) {
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
    read(target, receiver) {
      receiver(() => build(target));
    },
  };
}
