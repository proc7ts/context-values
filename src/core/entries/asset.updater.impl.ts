import { lazyValue, valueProvider } from '@proc7ts/primitives';
import { CxAsset } from '../asset';
import { CxEntry } from '../entry';

export function CxAsset$Updater$createDefault<TValue, TAsset, TUpdate = TAsset>(
    byDefault: (this: void, target: CxEntry.Target<TValue, TAsset>) => TValue,
): (target: CxEntry.Target<TValue, TAsset>) => CxAsset.Updater<TValue, TUpdate> {
  return target => {

    let getValue: () => TValue;
    const reset = (): void => {
      getValue = lazyValue(() => byDefault(target));
    };

    return {
      get(): TValue {
        return getValue();
      },
      set(update: TUpdate) {
        getValue = valueProvider(update as unknown as TValue);
      },
      reset,
    };
  };
}
