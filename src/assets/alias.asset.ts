import { Supply } from '@proc7ts/supply';
import { CxReferenceError } from '../build';
import { CxAsset, CxEntry, CxValues } from '../core';

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
    buildAssets(target, collector) {
      collector(() => {
        try {
          return target.get(alias);
        } catch (reason) {
          if (reason instanceof CxReferenceError) {
            throw new CxReferenceError(target.entry, undefined, reason);
          }
          throw reason;
        }
      });
    },
  };
}
