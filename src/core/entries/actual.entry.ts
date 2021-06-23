import { lazyValue, valueProvider } from '@proc7ts/primitives';
import { CxAsset } from '../asset';
import { CxEntry } from '../entry';

/**
 * Creates single-valued context entry definer that treats the {@link CxEntry.Target.trackActualAsset actual asset}
 * as entry value.
 *
 * The entry value updated each time the {@link CxEntry.Target.trackActualAsset actual asset} changes.
 *
 * @typeParam TValue - Context value asset type.
 * @param byDefault - Creates default entry value used when there is no assets.
 *
 * @returns New context entry definer.
 */
export function cxActual<TValue>(
    {
      byDefault,
    }: {
      byDefault(this: void, target: CxEntry.Target<TValue>): TValue;
    },
): CxEntry.Definer<TValue>;

/**
 * Creates actual single-valued context entry definer.
 *
 * The entry value updated each time the {@link CxEntry.Target.trackActualAsset actual asset} changes.
 *
 * @typeParam TValue - Context value type.
 * @param createUpdater - Creates the entry value updater. Accepts entry definition target as the only parameter.
 * This method is called at most once per context. The returned updater is then notified when actual asset changes.
 *
 * @returns New context entry definer.
 */
export function cxActual<TValue, TAsset>(
    {
      createUpdater,
    }: {
      createUpdater(this: void, target: CxEntry.Target<TValue, TAsset>): CxAsset.Updater<TValue, TAsset>;
    },
): CxEntry.Definer<TValue, TAsset>;

export function cxActual<TValue, TAsset>(
    {
      byDefault,
      createUpdater = CxAsset$createDefaultUpdater(byDefault!),
    }: {
      byDefault?(this: void, target: CxEntry.Target<TValue, TAsset>): TValue;
      createUpdater?(this: void, target: CxEntry.Target<TValue, TAsset>): CxAsset.Updater<TValue, TAsset>;
    },
): CxEntry.Definer<TValue, TAsset> {

  return target => {

    const getUpdater = lazyValue(() => createUpdater(target));
    let getValue = (): TValue | undefined => {

      const updater = getUpdater();

      getValue = () => updater.get();
      target.trackActualAsset(asset => asset ? updater.set(asset.get()) : updater.reset());

      return getValue();
    };

    return {
      get: () => getValue(),
    };

  };
}

function CxAsset$createDefaultUpdater<TValue, TAsset>(
    byDefault: (this: void, target: CxEntry.Target<TValue, TAsset>) => TValue,
): (target: CxEntry.Target<TValue, TAsset>) => CxAsset.Updater<TValue, TAsset> {
  return target => {

    let getValue: () => TValue;
    const reset = (): void => {
      getValue = lazyValue(() => byDefault(target));
    };

    return {
      get(): TValue {
        return getValue();
      },
      set(asset: TAsset) {
        getValue = valueProvider(asset as unknown as TValue);
      },
      reset,
    };
  };
}
