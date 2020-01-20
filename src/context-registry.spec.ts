import { AIterable } from 'a-iterable';
import { ContextRegistry } from './context-registry';
import { ContextValues } from './context-values';
import { SingleContextKey } from './simple-context-key';
import Mock = jest.Mock;

describe('ContextRegistry', () => {

  const key = new SingleContextKey<string>('test-key');
  let registry: ContextRegistry;
  let values: ContextValues;
  let mockProvider: Mock<string>;

  beforeEach(() => {
    registry = new ContextRegistry();
    values = registry.newValues();
    mockProvider = jest.fn().mockName('mockProvider');
    registry.provide({ a: key, by: mockProvider });
  });

  describe('Value seed request', () => {
    it('empty seed by default', () => {
      expect([...values.get(key.seedKey)]).toEqual([]);
    });
    it('respects seed fallback', () => {
      expect([...values.get(key.seedKey, { or: AIterable.from(['default']) })]).toEqual(['default']);
    });
    it('prefers explicit seed', () => {

      const value = 'test value';

      mockProvider.mockReturnValue(value);

      expect([...values.get(key.seedKey, { or: AIterable.from(['default']) })]).toEqual([value]);
    });
    it('caches value seed', () => {

      const value = 'test value';

      mockProvider.mockReturnValue(value);

      expect([...values.get(key.seedKey)]).toEqual([value]);
      expect(values.get(key)).toBe(value);

      mockProvider.mockReturnValue('other');

      expect([...values.get(key.seedKey)]).toEqual([value]);
      expect(values.get(key)).toBe(value);
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

  describe('append', () => {

    let registry2: ContextRegistry;
    let combined: ContextRegistry;
    let context: ContextValues;

    beforeEach(() => {
      registry2 = new ContextRegistry();
      combined = registry.append(registry2);
      context = { name: 'context', get: combined.newValues().get } as any;
    });

    it('contains all sources', () => {
      mockProvider.mockReturnValue('1');
      registry2.provide({ a: key, is: '2' });
      registry2.provide({ a: key, is: '3' });
      expect([...combined.seed(context, key.seedKey)]).toEqual(['1', '2', '3']);
    });
    it('accesses sources only once', () => {
      mockProvider.mockReturnValue('1');

      const provider2 = jest.fn(() => '2').mockName('provider2');

      registry2.provide({ a: key, by: provider2 });
      expect([...context.get(key.seedKey)]).toEqual(['1', '2']);
      expect(mockProvider).toHaveBeenCalledTimes(1);
      expect(provider2).toHaveBeenCalledTimes(1);
    });
    it('contains reverted sources', () => {
      mockProvider.mockReturnValue('1');
      registry2.provide({ a: key, is: '2' });
      registry2.provide({ a: key, is: '3' });
      expect([...combined.seed(context, key.seedKey).reverse()]).toEqual(['3', '2', '1']);
    });
  });
});
