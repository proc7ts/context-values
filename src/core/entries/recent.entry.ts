import { lazyValue } from '@proc7ts/primitives';
import { CxAsset } from '../asset';
import { CxEntry } from '../entry';
import { CxAsset$Updater$createDefault } from './asset.updater.impl';

/**
 * Creates single-valued context entry definer that treats the {@link CxEntry.Target.trackRecentAsset most recent asset}
 * as entry value.
 *
 * The entry value updated each time the {@link CxEntry.Target.trackRecentAsset most recent asset} changes.
 *
 * @typeParam TValue - Context value asset type.
 * @param byDefault - Creates default entry value used when there are no assets.
 *
 * @returns New context entry definer.
 */
export function cxRecent<TValue>(
    {
      byDefault,
    }: {
      byDefault(this: void, target: CxEntry.Target<TValue>): TValue;
    },
): CxEntry.Definer<TValue>;

/**
 * Creates single-valued context entry definer based on the {@link CxEntry.Target.trackRecentAsset most recent asset}.
 *
 * The entry value updated each time the {@link CxEntry.Target.trackRecentAsset most recent asset} changes.
 *
 * @typeParam TValue - Context value type.
 * @typeParam TAsset - Context value asset type.
 * @param createUpdater - Creates the entry value updater. Accepts entry definition target as the only parameter.
 * This method is called at most once per context. The returned updater is then notified when most recent asset changes.
 *
 * @returns New context entry definer.
 */
export function cxRecent<TValue, TAsset>(
    {
      createUpdater,
    }: {
      createUpdater(this: void, target: CxEntry.Target<TValue, TAsset>): CxAsset.Updater<TValue, TAsset>;
    },
): CxEntry.Definer<TValue, TAsset>;

export function cxRecent<TValue, TAsset>(
    {
      byDefault,
      createUpdater = CxAsset$Updater$createDefault(byDefault!),
    }: {
      byDefault?(this: void, target: CxEntry.Target<TValue, TAsset>): TValue;
      createUpdater?(this: void, target: CxEntry.Target<TValue, TAsset>): CxAsset.Updater<TValue, TAsset>;
    },
): CxEntry.Definer<TValue, TAsset> {
  return target => {

    const getUpdater = lazyValue(() => createUpdater(target));
    let getValue = (): TValue => {

      const updater = getUpdater();

      getValue = () => updater.get();
      target.trackRecentAsset(asset => asset ? updater.set(asset.asset) : updater.reset());

      return getValue();
    };

    return {
      assign(assigner) {
        assigner(getValue());
      },
    };
  };
}
