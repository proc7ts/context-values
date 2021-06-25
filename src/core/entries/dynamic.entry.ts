import { lazyValue, valuesProvider } from '@proc7ts/primitives';
import { CxAsset } from '../asset';
import { CxEntry } from '../entry';
import { CxAsset$Updater$createDefault } from './asset.updater.impl';

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
 * @param byDefault - Creates entry value used when there are no assets.
 *
 * @returns New context entry definer.
 */
export function cxDynamic<TElement>(
    // eslint-disable-next-line @typescript-eslint/unified-signatures
    {
      byDefault,
    }: {
      byDefault(this: void, target: CxEntry.Target<readonly TElement[], TElement>): readonly TElement[];
    }
): CxEntry.Definer<readonly TElement[], TElement>;

/**
 * Creates single-valued context entry definer based on {@link CxEntry.Target.trackAssetList entry asset list}.
 *
 * The entry value updated each time an asset provided or revoked.
 *
 * @typeParam TValue - Context value type.
 * @typeParam TAsset - Context value asset type.
 * @param createUpdater - Creates the entry value updater. Accepts entry definition target as the only parameter.
 * This method is called at most once per context. The returned updater is then notified on assets change.
 *
 * @returns New context entry definer.
 */
export function cxDynamic<TValue, TAsset = TValue>(
    {
      createUpdater,
    }: {
      createUpdater(this: void, target: CxEntry.Target<TValue, TAsset>): CxAsset.Updater<TValue, TAsset[]>;
    },
): CxEntry.Definer<TValue, TAsset>;

export function cxDynamic<TValue, TAsset>(
    {
        byDefault = valuesProvider<any>(),
        createUpdater = CxAsset$Updater$createDefault<TValue, TAsset, TAsset[]>(byDefault),
    }: {
      byDefault?(target: CxEntry.Target<TValue, TAsset>): TValue;
      createUpdater?(target: CxEntry.Target<TValue, TAsset>): CxAsset.Updater<TValue, TAsset[]>;
    } = {},
): CxEntry.Definer<TValue, TAsset> {
  return target => {

    const getUpdater = lazyValue(() => createUpdater(target));
    let getValue = (): TValue | undefined => {

      const updater = getUpdater();

      getValue = () => updater.get();
      target.trackAssetList(assets => assets.length
          ? updater.set(cxDynamic$assets(assets))
          : updater.reset());

      return getValue();
    };

    return {
      get: () => getValue(),
    };
  };
}

function cxDynamic$assets<TAsset>(assets: CxAsset.Provided<TAsset>[]): TAsset[] {

  const result: TAsset[] = [];
  const addAsset = (asset: TAsset): void => {
    result.push(asset);
  };

  for (const provided of assets) {
    provided.eachAsset(addAsset);
  }

  return result;
}
