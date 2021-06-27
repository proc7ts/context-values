import { CxEntry } from '../entry';
import { CxRequest } from '../request';
import { CxRequestMethod } from '../request-method';
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
 * @param definer - An entry definer that defines the entry in target `scope`.
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
      assign(set: CxEntry.Assigner<TValue>, request: CxRequest<TValue>) {
        context.get(
            target.entry,
            {
              ...request,
              by: CxRequestMethod.Assets,
              set,
            },
        );
      },
      assignDefault(set: CxEntry.Assigner<TValue>, request: CxRequest<TValue>) {
        context.get(
            target.entry,
            {
              ...request,
              by: CxRequestMethod.Defaults,
              set,
            },
        );
      },
    };
  };
}

/**
 * Creates value definer with scoped default value.
 *
 * Unlike {@link cxScoped}, the definer created by this function scopes only {@link CxEntry.Definition.assignDefault
 * default value}, while the {@link CxEntry.Definition.assign value provided by assets} is always evaluated in the
 * requested context.
 *
 * @param scope - Context entry containing target scope as its value.
 * @param definer - An entry definer that defines the entry.
 *
 * @returns New scoped context entry definer.
 */
export function cxDefaultScoped<TValue, TAsset = TValue, TContext extends CxValues = CxValues>(
    scope: CxEntry<TContext, unknown>,
    definer: CxEntry.Definer<TValue, TAsset>,
): CxEntry.Definer<TValue, TAsset> {
  return target => {

    const context = target.get(scope);

    if (context === target.context) {
      return definer(target);
    }

    const getDefiner = target.lazy(definer);

    return {
      assign(assigner: CxEntry.Assigner<TValue>, request: CxRequest<TValue>) {
        getDefiner().assign?.(assigner, request);
      },
      assignDefault(set: CxEntry.Assigner<TValue>, request: CxRequest<TValue>) {
        context.get(
            target.entry,
            {
              ...request,
              by: CxRequestMethod.Defaults,
              set,
            },
        );
      },
    };
  };
}
