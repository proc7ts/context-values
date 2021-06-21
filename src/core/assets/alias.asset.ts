import { Supply } from '@proc7ts/supply';
import { CxAsset } from '../asset';
import { CxEntry } from '../entry';
import { CxValues } from '../values';

/**
 * Creates aliasing context entry asset.
 *
 * @typeParam TAsset - Context value asset type.
 * @typeParam TContext - Context type.
 * @param entry - Target context entry.
 * @param alias - Context entry which value is used as an asset of the `target` entry.
 * @param supply - Asset supply. Removes the created asset once cut off.
 *
 * @returns New context entry asset.
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
