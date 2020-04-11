import { AIterable } from '@proc7ts/a-iterable';
import { valueProvider } from '@proc7ts/call-thru';
import { ContextRegistry } from './context-registry';
import { ContextValues } from './context-values';
import { MultiContextKey } from './multi-context-key';
import { SingleContextKey } from './single-context-key';
import Mock = jest.Mock;

describe('ContextRegistry', () => {

  const key = new SingleContextKey<string>('test-key');
  const multiKey = new MultiContextKey<string>('test-key');
  let registry: ContextRegistry;
  let values: ContextValues;
  let mockProvider: Mock<string>;

  beforeEach(() => {
    registry = new ContextRegistry();
    values = registry.newValues();
    mockProvider = jest.fn().mockName('mockProvider');
    registry.provide({ a: key, by: mockProvider });
    registry.provide({ a: multiKey, by: mockProvider });
  });

  describe('Value seed request', () => {
    it('empty seed by default', () => {
      expect(values.get(key.seedKey)()).toBeUndefined();
      expect([...values.get(multiKey.seedKey)]).toEqual([]);
    });
    it('respects seed fallback', () => {
      expect(values.get(key.seedKey, { or: valueProvider('default') })()).toBe('default');
      expect([...values.get(multiKey.seedKey, { or: AIterable.from(['default']) })]).toEqual(['default']);
    });
    it('prefers explicit seed', () => {

      const value = 'test value';

      mockProvider.mockReturnValue(value);

      expect(values.get(key.seedKey, { or: valueProvider('default') })()).toBe(value);
      expect([...values.get(multiKey.seedKey, { or: AIterable.from(['default']) })]).toEqual([value]);
    });
    it('caches value seed', () => {

      const value = 'test value';

      mockProvider.mockReturnValue(value);

      expect(values.get(key.seedKey)()).toBe(value);
      expect([...values.get(multiKey.seedKey)]).toEqual([value]);
      expect(values.get(key)).toBe(value);
      expect([...values.get(multiKey)]).toEqual([value]);

      mockProvider.mockReturnValue('other');

      expect(values.get(key.seedKey)()).toBe(value);
      expect([...values.get(multiKey.seedKey)]).toEqual([value]);
      expect(values.get(key)).toBe(value);
      expect([...values.get(multiKey)]).toEqual([value]);
    });
  });

  describe('Providers combination', () => {

    let provider2Spy: Mock;

    beforeEach(() => {
      provider2Spy = jest.fn();
      registry.provide({ a: key, by: provider2Spy });
    });

    it('provides the last constructed value', () => {
      mockProvider.mockReturnValue('value1');
      provider2Spy.mockReturnValue('value2');

      expect(values.get(key)).toBe('value2');
    });
    it('provides the first constructed value if the second one is undefined', () => {
      mockProvider.mockReturnValue('value1');

      expect(values.get(key)).toBe('value1');
    });
    it('provides the first constructed value if the second one is null', () => {
      mockProvider.mockReturnValue('value1');
      provider2Spy.mockReturnValue(null);

      expect(values.get(key)).toBe('value1');
    });
  });

  function testChained(title: string, createChained: () => ContextRegistry): void {
    describe(title, () => {

      let chained: ContextRegistry;
      let chainedValues: ContextValues;
      let provider2Spy: Mock;

      beforeEach(() => {
        chained = createChained();
        chainedValues = chained.newValues();
        provider2Spy = jest.fn();
      });

      it('prefers explicit value', () => {

        const value1 = 'initial value';
        const value2 = 'actual value';

        mockProvider.mockReturnValue(value1);

        chained.provide({ a: key, by: provider2Spy });
        provider2Spy.mockReturnValue(value2);

        expect(chainedValues.get(key)).toBe(value2);
      });
      it('falls back to initial value', () => {

        const value1 = 'initial value';

        mockProvider.mockReturnValue(value1);

        chained.provide({ a: key, by: provider2Spy });
        provider2Spy.mockReturnValue(null);

        expect(chainedValues.get(key)).toBe(value1);
      });
    });
  }

  testChained(
      'Registry chained with bound seeds',
      () => new ContextRegistry(registry.seedIn({ name: 'context' } as any)),
  );
  testChained(
      'Registry chained with context values',
      () => new ContextRegistry(values),
  );

  describe('newValues', () => {
    it('preserves non-caching instance', () => {
      expect(registry.newValues(false)).toBe(registry.newValues(false));
    });
    it('does not preserve caching instances', () => {
      expect(registry.newValues()).not.toBe(registry.newValues(false));
      expect(registry.newValues()).not.toBe(registry.newValues());
    });
  });
});
