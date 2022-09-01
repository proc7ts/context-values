import { CxEntry, CxRequestMethod, CxTracker } from '../core';
import { CxTracker$assign, CxTracker$create, CxTracker$default } from './tracker.impl';

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
    create?: undefined;
    byDefault?: ((this: void, target: CxEntry.Target<TValue>) => TValue) | undefined;
    assign?: undefined;
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
export function cxRecent<TValue, TAsset = TValue>({
  create,
  byDefault,
}: {
  create(this: void, recent: TAsset, target: CxEntry.Target<TValue, TAsset>): TValue;
  byDefault?: ((this: void, target: CxEntry.Target<TValue, TAsset>) => TValue) | undefined;
  assign?: undefined;
}): CxEntry.Definer<TValue, TAsset>;

/**
 * Creates single-valued context entry definer with internal state based on {@link CxEntry.Target.trackRecentAsset most
 * recent asset} and without default state.
 *
 * The internal state updated each time the {@link CxEntry.Target.trackRecentAsset most recent asset} changes.
 *
 * @typeParam TValue - Context value type.
 * @typeParam TAsset - Context value asset type.
 * @typeParam TState - Internal state type.
 * @param create - Creates internal entry state by recent asset.
 * @param access - Converts internal state tracker to entry value assigner.
 *
 * @returns New context entry definer.
 */
export function cxRecent<TValue, TAsset = TValue, TState = TValue>({
  create,
  assign,
}: {
  create(this: void, recent: TAsset, target: CxEntry.Target<TValue, TAsset>): TState;

  byDefault?: undefined;

  assign(
    this: void,
    tracker: CxTracker<TState>,
    target: CxEntry.Target<TValue, TAsset>,
  ): CxEntry.Assigner<TValue>;
}): CxEntry.Definer<TValue, TAsset>;

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
 * at most once per context.
 * @param assign - Converts internal state tracker to entry value assigner.
 *
 * @returns New context entry definer.
 */
export function cxRecent<TValue, TAsset = TValue, TState = TValue>(
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  {
    create,
    byDefault,
    assign,
  }: {
    create(this: void, recent: TAsset, target: CxEntry.Target<TValue, TAsset>): TState;

    byDefault(this: void, target: CxEntry.Target<TValue, TAsset>): TState;

    assign(
      this: void,
      tracker: CxTracker.Mandatory<TState>,
      target: CxEntry.Target<TValue, TAsset>,
    ): CxEntry.Assigner<TValue>;
  },
): CxEntry.Definer<TValue, TAsset>;

export function cxRecent<TValue, TAsset, TState>({
  create = cxRecent$create,
  byDefault,
  assign = CxTracker$assign,
}: {
  create?(this: void, recent: TAsset, target: CxEntry.Target<TValue, TAsset>): TState;
  byDefault?(this: void, target: CxEntry.Target<TValue, TAsset>): TState;
  assign?(
    this: void,
    tracker: CxTracker<TState>,
    target: CxEntry.Target<TValue, TAsset>,
  ): CxEntry.Assigner<TValue>;
} = {}): CxEntry.Definer<TValue, TAsset> {
  return target => {
    const getDefault = byDefault && target.lazy(byDefault);
    const tracker = CxTracker$create<TState>(
      target,
      receiver => target.trackRecentAsset(evaluated => evaluated
            ? receiver(create(evaluated.asset, target), CxRequestMethod.Assets)
            : receiver()),
      getDefault,
    );
    const defaultTracker = CxTracker$default<TState>(target, getDefault);

    return {
      assign: assign(tracker, target),
      assignDefault: assign(defaultTracker, target),
    };
  };
}

function cxRecent$create<TValue, TAsset, TState>(
  recent: TAsset,
  _target: CxEntry.Target<TValue, TAsset>,
): TState {
  return recent as unknown as TState;
}
