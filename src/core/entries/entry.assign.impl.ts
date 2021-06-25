import { lazyValue } from '@proc7ts/primitives';
import { CxEntry } from '../entry';

export function CxEntry$assign<TValue>(
    getValue: () => TValue | null | undefined,
): (assigner: CxEntry.Assigner<TValue>) => void {

  const get = lazyValue(getValue);

  return assigner => {

    const value = get();

    if (value != null) {
      assigner(value);
    }
  };
}
