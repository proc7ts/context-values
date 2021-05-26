import { describe, expect, it } from '@jest/globals';
import { noop } from '@proc7ts/primitives';
import { Contextual, Contextual__symbol, isContextual } from './contextual';

describe('isContextual', () => {
  it('returns `true` for contextual reference', () => {
    expect(isContextual({ [Contextual__symbol]: noop })).toBe(true);
  });
  it('returns `true` for functional contextual reference', () => {

    const contextual = ((): number => 1) as unknown as Contextual<number>;

    contextual[Contextual__symbol] = noop;

    expect(isContextual({ [Contextual__symbol]: noop })).toBe(true);
  });
  it('returns `false` for `null` value', () => {
    expect(isContextual(null)).toBe(false);
  });
  it('returns `false` for non-object value', () => {
    expect(isContextual(1)).toBe(false);
    expect(isContextual('foo')).toBe(false);
  });
  it('returns `false` if `[Contextual__symbol]` is not a method', () => {
    expect(isContextual({ [Contextual__symbol]: 1 })).toBe(false);
  });
});
