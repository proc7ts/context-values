import { valuesProvider } from '@proc7ts/primitives';
import { CxEntry } from '../entry';
import { CxEntry$assign } from './entry.assign.impl';

/**
 * Creates array-valued context entry definer.
 *
 * The entry value is a read-only array of assets.
 *
 * The entry value is evaluated at most once.
 *
 * @typeParam TElement - Array element type. The same as entry value asset type.
 * @param byDefault - Creates {@link CxEntry.Definition.assignDefault default} entry value. Accepts entry definition
 * target as the only parameter. Empty array will be used as default value when omitted.
 *
 * @returns New context entry definer.
 */
export function cxArray<TElement>(
    {
      byDefault = valuesProvider(),
    }: {
      byDefault?(
          this: void,
          target: CxEntry.Target<readonly TElement[], TElement>,
      ): readonly TElement[] | null | undefined;
    } = {},
): CxEntry.Definer<readonly TElement[], TElement> {
  return target => ({
    assign: CxEntry$assign(() => {

      const array: TElement[] = [];

      target.eachAsset(asset => {
        array.push(asset);
      });

      return array.length ? array : null;
    }),
    assignDefault: CxEntry$assign(() => byDefault(target)),
  });
}
