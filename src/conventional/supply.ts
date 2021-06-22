import { lazyValue } from '@proc7ts/primitives';
import { alwaysSupply, Supply } from '@proc7ts/supply';
import { CxEntry } from '../core';

/**
 * Context values supply.
 *
 * It is used to signal when context is no longer used (e.g. destroyed).
 *
 * A context value entry should destroy the provided value in such case.
 */
export type CxSupply = Supply;

/**
 * Context entry containing {@link CxSupply context values supply} as its value.
 *
 * It is guaranteed to present.
 *
 * Predefined to the {@link CxValues.supply supply of the context} if present. Defaults to supply-always otherwise.
 */
export const CxSupply: CxEntry<CxSupply> = {
  perContext(target) {
    return {
      get: lazyValue(() => {

        let result = target.context.supply;

        target.eachActualAsset(asset => {
          result = asset;
          return false;
        });

        return result;
      }),
      getDefault: () => target.context.supply || alwaysSupply(),
    };
  },
};
