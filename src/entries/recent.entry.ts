import { CxEntry, cxUnavailable } from '../core';

/**
 * Creates single-valued context entry definer that treats the {@link CxEntry.Target.trackRecentAsset most recent asset}
 * as entry value, or becomes unavailable when there is no one.
 *
 * The entry value updated each time the {@link CxEntry.Target.trackRecentAsset most recent asset} changes.
 *
 * @typeParam TValue - Context value asset type.
 *
 * @returns New context entry definer.
 */
export function cxRecent<TValue>(): CxEntry.Definer<TValue>;

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
    // eslint-disable-next-line @typescript-eslint/unified-signatures
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
 * Creates single-valued context entry definer with internal state based on {@link CxEntry.Target.trackRecentAsset most
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
 * @param access - Converts internal state accessor to entity value accessor. This happens at most once per context.
 *
 * @returns New context entry definer.
 */
export function cxRecent<TValue, TAsset, TState>(
    {
      create,
      byDefault,
      access,
    }: {
      create(this: void, recent: TAsset, target: CxEntry.Target<TValue, TAsset>): TState;
      byDefault?(this: void, target: CxEntry.Target<TValue, TAsset>): TState;
      access(this: void, get: (this: void) => TState, target: CxEntry.Target<TValue, TAsset>): (this: void) => TValue;
    },
): CxEntry.Definer<TValue, TAsset>;

export function cxRecent<TValue, TAsset, TState>(
    {
      create = cxRecent$create,
      byDefault,
      access = cxRecent$access,
    }: {
      create?(this: void, recent: TAsset, target: CxEntry.Target<TValue, TAsset>): TState;
      byDefault?(this: void, target: CxEntry.Target<TValue, TAsset>): TState;
      access?(this: void, get: (this: void) => TState, target: CxEntry.Target<TValue, TAsset>): (this: void) => TValue;
    } = {},
): CxEntry.Definer<TValue, TAsset> {
  return target => {

    const getDefault = byDefault
        ? target.lazy(byDefault)
        : cxUnavailable(target.entry);
    let getAccessor = target.lazy(target => {

      let getState: () => TState;

      target.trackRecentAsset(evaluated => {
        if (evaluated) {

          const state = create(evaluated.asset, target);

          getState = () => state;
        } else {
          getState = getDefault;
        }
      });

      return access(() => getState(), target);
    });

    target.supply.whenOff(reason => {
      getAccessor = cxUnavailable(target.entry, undefined, reason);
    });

    return {
      assign(assigner) {
        assigner(getAccessor()());
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

function cxRecent$access<TValue, TAsset, TState>(
    get: (this: void) => TState,
    _target: CxEntry.Target<TValue, TAsset>,
): (this: void) => TValue {
  return get as unknown as () => TValue;
}
