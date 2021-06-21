import { valueProvider } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { CxAsset } from '../asset';
import { CxEntry } from '../entry';
import { CxValues } from '../values';

/**
 * Creates constant context entry asset.
 *
 * @typeParam TAsset - Context value asset type.
 * @typeParam TContext - Context type.
 * @param entry - Target context entry.
 * @param value - Constant value asset, or `null`/`undefined` to not provide any assets.
 * @param supply - Asset supply. Removes the created asset once cut off.
 *
 * @returns New context entry asset.
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

function CxAsset$provideNone<TValue, TAsset, TContext extends CxValues>(
    _target: CxEntry.Target<TValue, TAsset, TContext>,
    _receiver: CxAsset.Callback<TAsset>,
): void {
  // No assets.
}
