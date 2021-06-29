import { CxEntry } from '../core/entry';
import { CxEntry$assignOnce } from './entry.assign-once.impl';

/**
 * Creates single-valued context entry definer.
 *
 * Treats the last provided asset as entry value and ignores the rest of them.
 *
 * The entry value is evaluated at most once per context.
 *
 * @typeParam TValue - Context value type.
 * @param byDefault - Creates {@link CxEntry.Definition.assignDefault default} entry value. Accepts entry definition
 * target as the only parameter.
 *
 * @returns New context entry definer.
 */
export function cxSingle<TValue>(
    {
      byDefault,
    }: {
      byDefault?(this: void, target: CxEntry.Target<TValue>): TValue | null | undefined;
    } = {},
): CxEntry.Definer<TValue> {
  return target => ({
    assign: CxEntry$assignOnce(target, cxSingle$value),
    assignDefault: byDefault && CxEntry$assignOnce(target, byDefault),
  });
}

function cxSingle$value<TValue>(target: CxEntry.Target<TValue>): TValue | undefined {
  return target.recentAsset;
}
