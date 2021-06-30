import { CxEntry } from '../core';

export function cxRecent$access<TValue, TAsset, TState>(
    get: (this: void) => TState,
    _target: CxEntry.Target<TValue, TAsset>,
): (this: void) => TValue {
  return get as unknown as () => TValue;
}
