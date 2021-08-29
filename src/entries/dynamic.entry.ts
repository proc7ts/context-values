import { CxEntry, CxRequestMethod, CxTracker } from '../core';
import { CxTracker$assign, CxTracker$create, CxTracker$default } from './tracker.impl';

/**
 * Creates potentially empty array-valued context entry definer that treats all {@link CxEntry.Target.trackAssetList
 * entry assets} as entry value.
 *
 * The entry value updated each time an asset provided or revoked.
 *
 * @typeParam TElement - Array element type. The same as entry value asset type.
 *
 * @returns New context entry definer.
 */
export function cxDynamic<TElement>(): CxEntry.Definer<readonly TElement[], TElement>;

/**
 * Creates array-valued context entry definer that treats all {@link CxEntry.Target.trackAssetList entry assets}
 * as entry value.
 *
 * The entry value updated each time an asset provided or revoked.
 *
 * @typeParam TElement - Array element type. The same as entry value asset type.
 * @param byDefault - Creates entry value used when there are no assets. The default value evaluated at most once per
 * context.
 *
 * @returns New context entry definer.
 */
export function cxDynamic<TElement>(
    // eslint-disable-next-line @typescript-eslint/unified-signatures
    {
      byDefault,
    }: {
      create?: undefined;
      byDefault?:
          | ((this: void, target: CxEntry.Target<readonly TElement[], TElement>) => readonly TElement[])
          | undefined;
      assign?: undefined;
    }
): CxEntry.Definer<readonly TElement[], TElement>;

/**
 * Creates single-valued context entry definer based on {@link CxEntry.Target.trackAssetList entry asset list}.
 *
 * The entry value updated each time an asset provided or revoked.
 *
 * @typeParam TValue - Context value type.
 * @typeParam TAsset - Context value asset type.
 * @param create - Creates entry value based on assets array.
 * @param byDefault - Creates entry value used when there are no assets. The default value evaluated at most once per
 * context. When omitted, the default value would be unavailable.
 *
 * @returns New context entry definer.
 */
export function cxDynamic<TValue, TAsset = TValue>(
    {
      create,
      byDefault,
    }: {
      create(this: void, assets: TAsset[], target: CxEntry.Target<TValue, TAsset>): TValue;
      byDefault?: ((this: void, target: CxEntry.Target<TValue, TAsset>) => TValue) | undefined;
      assign?: undefined;
    },
): CxEntry.Definer<TValue, TAsset>;

/**
 * Creates single-valued context entry definer with internal state based on {@link CxEntry.Target.trackAssetList entry
 * asset list} and without default state.
 *
 * The internal state updated each time an asset provided or revoked.
 *
 * @typeParam TValue - Context value type.
 * @typeParam TAsset - Context value asset type.
 * @typeParam TState - Internal state type.
 * @param create - Creates internal entry state based on assets array.
 * @param assign - Converts internal state tracker to entry value assigner.
 *
 * @returns New context entry definer.
 */
export function cxDynamic<TValue, TAsset = TValue, TState = TValue>(
    {
      create,
      assign,
    }: {

      create(
          this: void,
          assets: TAsset[],
          target: CxEntry.Target<TValue, TAsset>,
      ): TState;

      byDefault?: undefined;

      assign(
          this: void,
          tracker: CxTracker<TState>,
          target: CxEntry.Target<TValue, TAsset>,
      ): CxEntry.Assigner<TValue>;

    },
): CxEntry.Definer<TValue, TAsset>;

/**
 * Creates single-valued context entry definer with internal state based on {@link CxEntry.Target.trackAssetList entry
 * asset list}.
 *
 * The internal state updated each time an asset provided or revoked.
 *
 * @typeParam TValue - Context value type.
 * @typeParam TAsset - Context value asset type.
 * @typeParam TState - Internal state type.
 * @param create - Creates internal entry state based on assets array.
 * @param byDefault - Creates default internal entry state when there are no assets. The default state evaluated at most
 * once per context. When omitted, the default value would be unavailable.
 * @param assign - Converts internal state tracker to entry value assigner.
 *
 * @returns New context entry definer.
 */
export function cxDynamic<TValue, TAsset = TValue, TState = TValue>(
    // eslint-disable-next-line @typescript-eslint/unified-signatures
    {
      create,
      byDefault,
      assign,
    }: {

      create(
          this: void,
          assets: TAsset[],
          target: CxEntry.Target<TValue, TAsset>,
      ): TState;

      byDefault(
          this: void,
          target: CxEntry.Target<TValue, TAsset>,
      ): TState;

      assign(
          this: void,
          tracker: CxTracker.Mandatory<TState>,
          target: CxEntry.Target<TValue, TAsset>,
      ): CxEntry.Assigner<TValue>;

    },
): CxEntry.Definer<TValue, TAsset>;

export function cxDynamic<TValue, TAsset, TState>(
    {
      create,
      byDefault,
      assign = CxTracker$assign,
    }: {
      create?(this: void, assets: TAsset[], target: CxEntry.Target<TValue, TAsset>): TState;
      byDefault?(this: void, target: CxEntry.Target<TValue, TAsset>): TState;
      assign?(this: void, tracker: CxTracker<TState>, target: CxEntry.Target<TValue, TAsset>): CxEntry.Assigner<TValue>;
    } = {},
): CxEntry.Definer<TValue, TAsset> {
  return target => {
    if (!byDefault && !create) {
      byDefault = cxDynamic$byDefault;
    }
    create ||= cxDynamic$create;

    const getDefault = byDefault && target.lazy(byDefault);
    const tracker = CxTracker$create<TState>(
        target,
        receiver => target.trackAssetList(list => {

          const assets: TAsset[] = [];

          for (const provided of list) {
            provided.eachAsset(asset => {
              assets.push(asset);
            });
          }

          return assets.length
              ? receiver(create!(assets, target), CxRequestMethod.Assets)
              : receiver();
        }),
        getDefault,
    );
    const defaultTracker = CxTracker$default<TState>(target, getDefault);

    return {
      assign: assign(tracker, target),
      assignDefault: assign(defaultTracker, target),
    };
  };
}

function cxDynamic$create<TValue, TAsset, TState>(
    assets: TAsset[],
    _target: CxEntry.Target<TValue, TAsset>,
): TState {
  return assets as unknown as TState;
}

function cxDynamic$byDefault<TState>(): TState {
  return [] as unknown as TState;
}
