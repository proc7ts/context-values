import { AfterEvent, translateAfter } from '@proc7ts/fun-events';
import { isPresent, lazyValue } from '@proc7ts/primitives';
import { CxAsset, CxEntry } from '../../core';
import { trackUcxAssets } from './track-assets';

/**
 * Creates multi-valued updatable context entry definer.
 *
 * The associated value is an `AfterEvent` keeper of all assets. It is always present, even though the keeper can send
 * an empty array.
 *
 * @typeParam TElement - Array element type. The same as entry value asset type.
 * @param byDefault - Creates default value. Accepts entry definition target as the only parameter.
 *
 * @returns New context entry definer.
 */
export function ucxMulti<TElement>(
    {
      byDefault,
    }: {
      byDefault?(
          this: void,
          target: CxEntry.Target<AfterEvent<TElement[]>, TElement>,
      ): TElement[] | null | undefined;
    } = {},
): CxEntry.Definer<AfterEvent<TElement[]>, TElement> {
  return target => ({
    get: lazyValue(() => trackUcxAssets(target).do(
        translateAfter((send, ...assetEvaluators: CxAsset.Evaluator<TElement>[]) => {

          const assets: TElement[] = assetEvaluators.map(getAsset => getAsset()).filter(isPresent);

          send(...(assets.length ? assets : byDefault?.(target) || []));
        }),
    )),
  });
}
