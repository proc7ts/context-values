import { CxEntry, cxUnavailable } from '../core';
import { cxRecent$access } from './recent.impl';

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
      byDefault?(this: void, target: CxEntry.Target<readonly TElement[], TElement>): readonly TElement[];
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
 * context.
 *
 * @returns New context entry definer.
 */
export function cxDynamic<TValue, TAsset>(
    {
      create,
      byDefault,
    }: {
      create(this: void, assets: TAsset[], target: CxEntry.Target<TValue, TAsset>): TValue;
      byDefault(this: void, target: CxEntry.Target<TValue, TAsset>): TValue;
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
 * once per context.
 * @param access - Converts internal state accessor to entity value accessor. The converter created at most once per
 * context.
 *
 * @returns New context entry definer.
 */
export function cxDynamic<TValue, TAsset, TState>(
    {
      create,
      byDefault,
      access,
    }: {
      create(this: void, assets: TAsset[], target: CxEntry.Target<TValue, TAsset>): TState;
      byDefault(this: void, target: CxEntry.Target<TValue, TAsset>): TState;
      access(this: void, get: (this: void) => TState, target: CxEntry.Target<TValue, TAsset>): (this: void) => TValue;
    },
): CxEntry.Definer<TValue, TAsset>;

export function cxDynamic<TValue, TAsset, TState>(
    {
      create = cxDynamic$create,
      byDefault,
      access = cxRecent$access,
    }: {
      create?(this: void, assets: TAsset[], target: CxEntry.Target<TValue, TAsset>): TState;
      byDefault?(this: void, target: CxEntry.Target<TValue, TAsset>): TState;
      access?(this: void, get: (this: void) => TState, target: CxEntry.Target<TValue, TAsset>): (this: void) => TValue;
    } = {},
): CxEntry.Definer<TValue, TAsset> {
  return target => {

    const getDefault = byDefault
        ? target.lazy(byDefault)
        : cxDynamic$byDefault;
    let getState: () => TState;
    let getAccessor = target.lazy(target => {
      target.trackAssetList(list => {

        const assets: TAsset[] = [];

        for (const provided of list) {
          provided.eachAsset(asset => {
            assets.push(asset);
          });
        }

        if (assets.length) {

          const state = create(assets, target);

          getState = () => state;
        } else {
          getState = getDefault;
        }
      });

      return access(() => getState(), target);
    });

    target.supply.whenOff(reason => {
      getState = getAccessor = cxUnavailable(target.entry, undefined, reason);
    });

    return {
      assign(assigner) {
        assigner(getAccessor()());
      },
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
