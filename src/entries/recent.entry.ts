import { CxEntry, cxUnavailable } from '../core';

/**
 * Creates single-valued context entry definer that treats the {@link CxEntry.Target.trackRecentAsset most recent asset}
 * as entry value.
 *
 * The entry value updated each time the {@link CxEntry.Target.trackRecentAsset most recent asset} changes.
 *
 * @typeParam TValue - Context value asset type.
 * @param byDefault - Creates default entry value used when there are no assets. The default value evaluated at most
 * once per context. When omitted, the default value would be unavailable.
 *
 * @returns New context entry definer.
 */
export function cxRecent<TValue>(
    {
      byDefault,
    }: {
      byDefault?(this: void, target: CxEntry.Target<TValue>): TValue;
    },
): CxEntry.Definer<TValue>;

/**
 * Creates single-valued context entry definer based on the {@link CxEntry.Target.trackRecentAsset most recent asset}.
 *
 * The entry value updated each time the {@link CxEntry.Target.trackRecentAsset most recent asset} changes.
 *
 * @typeParam TValue - Context value type.
 * @typeParam TAsset - Context value asset type.
 * @param create - Creates entry value based on recent asset.
 * @param byDefault - Creates default entry value used when there are no assets. The default value evaluated at most
 * once per context. When omitted, the default value would be unavailable.
 *
 * @returns New context entry definer.
 */
export function cxRecent<TValue, TAsset>(
    {
      create,
      byDefault,
    }: {
      create(this: void, recent: TAsset, target: CxEntry.Target<TValue, TAsset>): TValue;
      byDefault?(this: void, target: CxEntry.Target<TValue, TAsset>): TValue;
    },
): CxEntry.Definer<TValue, TAsset>;

/**
 * Creates single-valued context entry definer with internal state base on {@link CxEntry.Target.trackRecentAsset most
 * recent asset}.
 *
 * The entry value updated each time the {@link CxEntry.Target.trackRecentAsset most recent asset} changes.
 *
 * @typeParam TValue - Context value type.
 * @typeParam TAsset - Context value asset type.
 * @typeParam TState - Internal state type.
 * @param create - Creates internal entity state by recent asset.
 * @param byDefault - Creates default internal entity state when there are no assets. The default state evaluated
 * at most once per context. When omitted, the default state (and thus the value) would be unavailable.
 * @param delegate - Creates entity value based on entity state accessor. Such value is created at most once per
 * context. It is expected to delegate its functionality to internal state. E.g. when the value is a function.
 *
 * @returns New context entry definer.
 */
export function cxRecent<TValue, TAsset, TState>(
    {
      create,
      byDefault,
      delegate,
    }: {
      create(this: void, recent: TAsset, target: CxEntry.Target<TValue, TAsset>): TState;
      byDefault?(this: void, target: CxEntry.Target<TValue, TAsset>): TState;
      delegate(this: void, get: (this: void) => TState, target: CxEntry.Target<TValue, TAsset>): TValue;
    },
): CxEntry.Definer<TValue, TAsset>;

export function cxRecent<TValue, TAsset, TState>(
    {
      create = cxRecent$create,
      byDefault,
      delegate = cxRecent$delegate,
    }: {
      create?(this: void, recent: TAsset, target: CxEntry.Target<TValue, TAsset>): TState;
      byDefault?(this: void, target: CxEntry.Target<TValue, TAsset>): TState;
      delegate?(this: void, get: (this: void) => TState, target: CxEntry.Target<TValue, TAsset>): TValue;
    },
): CxEntry.Definer<TValue, TAsset> {
  return target => {

    const getDefault = byDefault
        ? target.lazy(byDefault)
        : cxUnavailable(target.entry);
    let getState: () => TState;
    let getValue = target.lazy(target => {
      target.trackRecentAsset(evaluated => {
        getState = evaluated
            ? () => create(evaluated.asset, target)
            : getDefault;
      }).whenOff(reason => {
        getValue = cxUnavailable(target.entry, undefined, reason);
      });

      return delegate(() => getState(), target);
    });

    return {
      assign(assigner) {
        assigner(getValue());
      },
    };
  };
}

function cxRecent$create<TValue, TAsset, TState>(
    recent: TAsset,
    _target: CxEntry.Target<TValue, TAsset>,
): TState {
  return recent as unknown as TState;
}

function cxRecent$delegate<TValue, TAsset, TState>(
    get: (this: void) => TState,
    _target: CxEntry.Target<TValue, TAsset>,
): TValue {
  return get() as unknown as TValue;
}
