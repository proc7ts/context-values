import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import type { ContextRef } from '../context-ref';
import type { ContextValues } from '../context-values';
import { ContextRegistry } from '../registry';
import { SingleContextKey } from '../singleton';
import { applyContextTo } from './apply-context-to';
import { Contextual__symbol } from './contextual';

describe('applyContextTo', () => {

  let registry: ContextRegistry;
  let context: ContextValues;

  beforeEach(() => {
    registry = new ContextRegistry();
    context = registry.newValues();
  });

  let key: ContextRef<string>;

  beforeAll(() => {
    key = new SingleContextKey<string>('test-key');
  });

  it('converts bare value to its provider', () => {
    registry.provide({ a: key, by: applyContextTo('test') });
    expect(context.get(key)).toBe('test');
  });
  it('converts `null` value to noop provider', () => {
    registry.provide({ a: key, by: applyContextTo(null) });
    expect(context.get(key, { or: 'fallback' })).toBe('fallback');
  });
  it('converts contextual value to its resolver', () => {
    registry.provide({ a: key, by: applyContextTo({ [Contextual__symbol]: () => 'test' }) });
    expect(context.get(key)).toBe('test');
  });
});
