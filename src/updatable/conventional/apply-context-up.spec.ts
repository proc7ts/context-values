import { afterThe } from '@proc7ts/fun-events';
import { valueProvider } from '@proc7ts/primitives';
import type { ContextValues } from '../../context-values';
import { Contextual__symbol } from '../../conventional';
import { ContextRegistry } from '../../registry';
import type { SingleContextUpRef } from '../single-context-up-key';
import { SingleContextUpKey } from '../single-context-up-key';
import { applyContextUp } from './apply-context-up';

describe('applyContextUp', () => {

  let registry: ContextRegistry;
  let context: ContextValues;

  beforeEach(() => {
    registry = new ContextRegistry();
    context = registry.newValues();
  });

  let key: SingleContextUpRef<string>;

  beforeAll(() => {
    key = new SingleContextUpKey('test-key');
  });

  it('resolves contextual references', async () => {
    registry.provide({ a: key, by: applyContextUp(afterThe({ [Contextual__symbol]: valueProvider('test') })) });
    expect(await context.get(key)).toBe('test');
  });
  it('provides bare values', async () => {
    registry.provide({ a: key, by: applyContextUp(afterThe('test')) });
    expect(await context.get(key)).toBe('test');
  });
  it('drops `null` and `undefined` values', async () => {
    registry.provide({ a: key, by: applyContextUp(afterThe<(string | null | undefined)[]>(undefined, null)) });
    expect(await context.get(key, { or: afterThe('fallback') })).toBe('fallback');
  });

});
