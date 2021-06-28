import { CxEntry } from '../entry';
import { CxAsset$emptyArray } from './asset.updater.impl';
import { CxEntry$assignOnce } from './entry.assign-once.impl';

/**
 * Creates array-valued context entry definer.
 *
 * The entry value is a read-only array of assets.
 *
 * The entry value is evaluated at most once per context.
 *
 * @typeParam TElement - Array element type. The same as entry value asset type.
 * @param byDefault - Creates {@link CxEntry.Definition.assignDefault default} entry value. Accepts entry definition
 * target as the only parameter. Empty array will be used as default value when omitted.
 *
 * @returns New context entry definer.
 */
export function cxArray<TElement>(
    {
      byDefault = CxAsset$emptyArray,
    }: {
      byDefault?(
          this: void,
          target: CxEntry.Target<readonly TElement[], TElement>,
      ): readonly TElement[] | null | undefined;
    } = {},
): CxEntry.Definer<readonly TElement[], TElement> {
  return target => ({
    assign: CxEntry$assignOnce(target, cxArray$value),
    assignDefault: CxEntry$assignOnce(target, byDefault),
  });
}

function cxArray$value<TElement>(target: CxEntry.Target<readonly TElement[], TElement>): readonly TElement[] | null {

  const array: TElement[] = [];

  target.eachAsset(asset => {
    array.push(asset);
  });

  return array.length ? array : null;
}
