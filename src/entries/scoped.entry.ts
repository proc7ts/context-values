import { CxEntry, CxRequest, CxRequestMethod, CxValues } from '../core';

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
        if (request.by /* explicit request method */) {
          // Wrap request to handle fallback value.
          context.get(target.entry, cxScoped$request(CxRequestMethod.Assets, set, request));
        } else {
          // Perform full request.
          // The `assignDefault()` won't assign any value in this case.
          context.get(target.entry, { ...request, set });
        }
      },
      assignDefault(set: CxEntry.Assigner<TValue>, request: CxRequest<TValue>) {
        if (request.by /* explicit (defaults) request method */) {
          // Wrap request to handle fallback value.
          context.get(target.entry, cxScoped$request(CxRequestMethod.Defaults, set, request));
        }
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
      assignDefault(assigner: CxEntry.Assigner<TValue>, request: CxRequest<TValue>) {
        // Wrap request to handle fallback value.
        context.get(target.entry, cxScoped$request(CxRequestMethod.Defaults, assigner, request));
      },
    };
  };
}

function cxScoped$request<TValue>(
    by: CxRequestMethod,
    assigner: CxEntry.Assigner<TValue>,
    request: CxRequest<TValue>,
): CxRequest<TValue> {

  let { or } = request;
  let set: (this: void, value: TValue, by: CxRequestMethod) => void;

  if (or !== undefined /* fallback specified */) {
    // Pass the value through.
    set = assigner;
  } else {
    // Set fallback to `null` and ignore any fallback received.
    or = null;
    set = (value, receivedBy = by) => receivedBy && assigner(value, receivedBy);
  }

  return {
    ...request,
    or,
    by,
    set,
  };
}
