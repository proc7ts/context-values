import { CxAsset, CxEntry } from '../core';

export function CxAsset$emptyArray<TValue, TAsset>(_target: CxEntry.Target<TValue, TAsset>): TValue {
  return [] as unknown as TValue;
}

export function CxAsset$Updater$createDefault<TValue, TAsset, TUpdate = TAsset>(
    byDefault: (this: void, target: CxEntry.Target<TValue, TAsset>) => TValue,
): (target: CxEntry.Target<TValue, TAsset>) => CxAsset.Updater<TValue, TUpdate> {
  return target => {

    let getValue: () => TValue;
    const reset = (): void => {
      getValue = target.lazy(byDefault);
    };

    return {
      get(): TValue {
        return getValue();
      },
      set(update: TUpdate) {
        getValue = () => update as unknown as TValue;
      },
      reset,
    };
  };
}
