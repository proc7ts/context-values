import { AfterEvent, afterEventBy, afterThe, digAfter } from '@proc7ts/fun-events';
import { lazyValue } from '@proc7ts/primitives';
import { CxReferenceError } from '../../build';
import { CxAsset, CxEntry } from '../../core';
import { trackUcxAssets } from './track-assets';

/**
 * Creates single-valued updatable context entry definer.
 *
 * The entry value is an `AfterEvent` keeper of the last asset. It is always present, but signals a
 * {@link CxReferenceError} error on attempt to read absent value.
 *
 * @typeParam TValue - Context value type.
 * @param byDefault - Creates default value. Accepts entry definition target as the only parameter.
 *
 * @returns New context entry definer.
 */
export function ucxSingle<TValue>(
    {
      byDefault,
    }: {
      byDefault?(
          this: void,
          target: CxEntry.Target<AfterEvent<[TValue]>, TValue>,
      ): TValue | null | undefined;
    } = {},
): CxEntry.Definer<AfterEvent<[TValue]>, TValue> {
  return target => ({
    get: lazyValue(() => trackUcxAssets(target).do(
        digAfter((...assetEvaluators: CxAsset.Evaluator<TValue>[]): AfterEvent<[TValue]> => {
          for (let i = assetEvaluators.length - 1; i >= 0; --i) {

            const asset = assetEvaluators[i]();

            if (asset != null) {
              return afterThe(asset);
            }
          }

          const defaultValue = byDefault?.(target);

          if (defaultValue != null) {
            return afterThe(defaultValue);
          }

          const error = new CxReferenceError(target.entry);

          return afterEventBy(({ supply }) => supply.off(error));
        }),
    )),
  });
}
