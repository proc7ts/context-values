import { CxEntry } from '../core/entry';
import { CxValues } from '../core/values';

export function CxEntry$assignOnce<TValue, TAsset, TContext extends CxValues>(
    target: CxEntry.Target<TValue, TAsset, TContext>,
    getValue: (target: CxEntry.Target<TValue, TAsset, TContext>) => TValue | null | undefined,
): (assigner: CxEntry.Assigner<TValue>) => void {

  const get = target.lazy(getValue);

  return assigner => {

    const value = get();

    if (value != null) {
      assigner(value);
    }
  };
}
