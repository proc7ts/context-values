import { CxEntry } from '../entry';
import { CxValues } from '../values';

/**
 * Creates scoped context value definer.
 *
 * Here "scope" is a context available as an entry of itself. Thus context derived from that scope may access it via
 * the same entry.
 *
 * Scoped context value is the one available only in particular scope only.
 *
 * The entry definer created by this function accesses the scope, and then requests the value from that scope. Thus the
 * value would be the same regardless the context it is requested from.
 *
 * @param scope - Context entry containing target scope as its value.
 * @param definer - An entry definer that defines the entry in target `scope`. It won't be applied to anything else.
 *
 * @returns New scoped context entry definer.
 */
export function cxScoped<TValue, TAsset = TValue, TContext extends CxValues = CxValues>(
    scope: CxEntry<TContext, unknown>,
    definer: CxEntry.Definer<TValue, TAsset>,
): CxEntry.Definer<TValue, TAsset> {
  return target => {

    const context = target.get(scope);

    if (context === target.context) {
      return definer(target);
    }

    return {
      assign(assigner, request) {

        const value = context.get(target.entry, request);

        if (request.or === null && value === null) {
          return;
        }

        assigner(value!);
      },
    };
  };
}
