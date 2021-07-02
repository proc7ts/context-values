import { CxEntry, CxRequestMethod, cxUnavailable } from '../core';
import { cxRecent$access } from './recent.impl';

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
 * The internal state updated each time the {@link CxEntry.Target.trackRecentAsset most recent asset} changes.
 *
 * @typeParam TValue - Context value type.
 * @typeParam TAsset - Context value asset type.
 * @typeParam TState - Internal state type.
 * @param create - Creates internal entry state by recent asset.
 * @param byDefault - Creates default internal entry state when there are no assets. The default state evaluated
 * at most once per context. When omitted, the default state (and thus the value) would be unavailable.
 * @param access - Converts internal state accessor to entity value accessor.
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

    let getDefaultState = byDefault
        ? target.lazy(byDefault)
        : cxUnavailable(target.entry);
    let getState: () => TState;
    let getDefaultValue: (this: void) => TValue = access(() => getDefaultState(), target);
    let getValue: () => TValue = access(() => getState(), target);
    let getAssign: () => (assigner: CxEntry.Assigner<TValue>, isDefault: 0 | 1) => void = target.lazy(target => {

      let method!: CxRequestMethod;

      target.trackRecentAsset(evaluated => {
        if (evaluated) {

          const state = create(evaluated.asset, target);

          method = CxRequestMethod.Assets;
          getState = () => state;
        } else {
          method = CxRequestMethod.Defaults;
          getState = getDefaultState;
        }
      });

      return byDefault
          ? (assigner, isDefault) => isDefault
              ? assigner(getDefaultValue())
              : assigner(getValue(), method)
          : (assigner, isDefault) => !isDefault
              && method > 0
              && assigner(getValue(), method);
    });

    target.supply.whenOff(reason => {
      getDefaultState = getState = getDefaultValue = getValue = getAssign = cxUnavailable(
          target.entry,
          undefined,
          reason,
      );
    });

    return {
      assign(assigner) {
        getAssign()(assigner, 0);
      },
      assignDefault(assigner) {
        getAssign()(assigner, 1);
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
