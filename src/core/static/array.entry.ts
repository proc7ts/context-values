import { lazyValue, valuesProvider } from '@proc7ts/primitives';
import { CxEntry } from '../entry';

/**
 * Creates array-valued context entry definer.
 *
 * The entry value is a read-only array of assets.
 *
 * The entry value is evaluated at most once.
 *
 * @typeParam TElement - Array element type. The same as entry value asset type.
 * @param byDefault - Creates {@link CxEntry.Definition.getDefault default} entry value. Accepts entry definition target
 * as the only parameter. Empty array will be used as default value when omitted.
 *
 * @returns New context entry definer.
 */
export function cxArray<TElement>(
    {
      byDefault,
    }: {
      byDefault?: (
          this: void,
          target: CxEntry.Target<readonly TElement[], TElement>,
      ) => readonly TElement[] | undefined;
    } = {},
): CxEntry.Definer<readonly TElement[], TElement> {
  return target => ({
    get: lazyValue(() => {

      const array: TElement[] = [];

      target.eachAsset(asset => {
        array.push(asset);
      });

      return array.length ? array : null;
    }),
    getDefault: byDefault ? lazyValue(() => byDefault(target)) : valuesProvider(),
  });
}
