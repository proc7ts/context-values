import { CxEntry, CxValues } from '../core';

export function CxEntry$assignOnce<TValue, TAsset, TContext extends CxValues>(
  target: CxEntry.Target<TValue, TAsset, TContext>,
  getValue: (target: CxEntry.Target<TValue, TAsset, TContext>) => TValue | null | undefined,
): (receiver: CxEntry.Receiver<TValue>) => void {
  const get = target.lazy(getValue);

  return receiver => {
    const value = get();

    if (value != null) {
      receiver(value);
    }
  };
}
