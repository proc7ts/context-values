import { CxEntry } from '../core';
import { CxEntry$assignOnce } from './entry.assign-once.impl';

/**
 * Creates evaluating context entry definer.
 *
 * Evaluates entry value at most once per context.
 *
 * @typeParam TValue - Combined context value type.
 * @typeParam TAsset - A type of context value assets to combine.
 * @param evaluate - Evaluates entry value out. Accepts entry definition target as the only parameter.
 * @param byDefault - Evaluates {@link CxEntry.Definition.assignDefault default} entry value. Accepts entry definition
 * target as the only parameter. Evaluates to nothing by default.
 *
 * @returns New context entry definer.
 */
export function cxEvaluated<TValue, TAsset = TValue>(
    evaluate: (this: void, target: CxEntry.Target<TValue, TAsset>) => TValue | null | undefined,
    {
      byDefault = () => null,
    }: {
      byDefault?(
          this: void,
          target: CxEntry.Target<TValue, TAsset>,
      ): TValue | null | undefined;
    } = {},
): CxEntry.Definer<TValue, TAsset> {
  return target => ({
    assign: CxEntry$assignOnce(target, evaluate),
    assignDefault: CxEntry$assignOnce(target, byDefault),
  });
}
