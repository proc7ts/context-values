import { ContextRegistry } from './context-registry';
import { MultiContextKey, SingleContextKey } from './context-value';
import { ContextValues } from './context-values';
import Mock = jest.Mock;
import { AIterable } from 'a-iterable';

describe('ContextRegistry', () => {

  const key = new SingleContextKey<string>('test-key');
  let registry: ContextRegistry<ContextValues>;
  let values: ContextValues;
  let providerSpy: Mock;

  beforeEach(() => {
    registry = new ContextRegistry();
    values = registry.newValues();
    providerSpy = jest.fn();
    registry.provide({ a: key, by: providerSpy });
  });

  describe('Values sources', () => {
    it('empty sources by default', () => {
      expect([...values.get(key.sourcesKey)]).toEqual([]);
    });
    it('respects sources fallback', () => {

      const value = 'test value';

      expect([...values.get(key.sourcesKey, { or: AIterable.from([value])})]).toEqual([value]);
    });
    it('prefers explicit sources', () => {

      const value = 'test value';

      providerSpy.mockReturnValue(value);

      expect([...values.get(key.sourcesKey, { or: AIterable.from(['default'])})]).toEqual([value]);
    });
    it('caches value sources', () => {

      const value = 'test value';

      providerSpy.mockReturnValue(value);

      expect([...values.get(key.sourcesKey)]).toEqual([value]);
      expect(values.get(key)).toBe(value);

      providerSpy.mockReturnValue('other');

      expect([...values.get(key.sourcesKey)]).toEqual([value]);
      expect(values.get(key)).toBe(value);
    });
  });

  describe('Single value', () => {
    it('is associated with provided value', () => {

      const value = 'test value';

      providerSpy.mockReturnValue(value);

      expect(values.get(key)).toBe(value);
    });
    it('throws if there is no default value', () => {
      expect(() => values.get(new SingleContextKey(key.name))).toThrowError();
    });
    it('provides default value is there is no provider', () => {
      expect(values.get(new SingleContextKey<string>(key.name), { or: 'default' })).toBe('default');
    });
    it('provides default value if provider did not provide any value', () => {

      const defaultValue = 'default';
      const keyWithDefaults = new SingleContextKey(key.name, () => defaultValue);

      registry.provide({ a: keyWithDefaults, is: null });

      expect(values.get(keyWithDefaults)).toBe(defaultValue);
    });
    it('is associated with default value if there is no provider', () => {
      expect(values.get(new SingleContextKey<string>(key.name, () => 'default'))).toBe('default');
    });
    it('prefers fallback value over default one', () => {
      expect(values.get(new SingleContextKey<string>(key.name, () => 'key default'), { or: 'explicit default' }))
          .toBe('explicit default');
    });
    it('prefers `null` fallback value over key one', () => {
      expect(values.get(new SingleContextKey<string>(key.name, () => 'default'), { or: null }))
          .toBeNull();
    });
    it('prefers `undefined` fallback value over key one', () => {
      expect(values.get(new SingleContextKey<string>(key.name, () => 'default'), { or: undefined }))
          .toBeUndefined();
    });
    it('caches the value', () => {

      const value = 'value';

      providerSpy.mockReturnValue(value);

      expect(values.get(key)).toBe(value);
      expect(values.get(key)).toBe(value);

      expect(providerSpy).toHaveBeenCalledTimes(1);
    });
    it('caches default value', () => {

      const value = 'default value';
      const defaultProviderSpy = jest.fn(() => value);
      const keyWithDefault = new SingleContextKey('key-with-default', defaultProviderSpy);

      expect(values.get(keyWithDefault)).toBe(value);
      expect(values.get(keyWithDefault)).toBe(value);
      expect(defaultProviderSpy).toHaveBeenCalledTimes(1);
    });
    it('does not cache fallback value', () => {

      const value1 = 'value1';
      const value2 = 'value2';

      expect(values.get(key, { or: value1 })).toBe(value1);
      expect(values.get(key, { or: value2 })).toBe(value2);
    });
  });

  describe('Multi-value', () => {

    let multiKey: MultiContextKey<string>;

    beforeEach(() => {
      multiKey = new MultiContextKey('values');
    });

    it('is associated with empty array by default', () => {
      expect(values.get(multiKey)).toEqual([]);
    });
    it('is associated with empty array if providers did not return any values', () => {
      registry.provide({ a: multiKey, is: null });
      registry.provide({ a: multiKey, is: undefined });

      expect(values.get(multiKey)).toEqual([]);
    });
    it('is associated with default value if there is no provider', () => {

      const defaultValue = ['default'];
      const keyWithDefaults = new MultiContextKey('key', () => defaultValue);

      expect(values.get(keyWithDefaults)).toEqual(defaultValue);
    });
    it('is associated with default value if providers did not return any values', () => {

      const defaultValue = ['default'];
      const keyWithDefaults = new MultiContextKey('key', () => defaultValue);

      registry.provide({ a: keyWithDefaults, is: null });
      registry.provide({ a: keyWithDefaults, is: undefined });

      expect(values.get(keyWithDefaults)).toEqual(defaultValue);
    });
    it('is associated with provided values array', () => {
      registry.provide({ a: multiKey, is: 'a' });
      registry.provide({ a: multiKey, is: undefined });
      registry.provide({ a: multiKey, is: 'c' });

      expect(values.get(multiKey)).toEqual(['a', 'c']);
    });
    it('is associated with value', () => {
      registry.provide({ a: multiKey, is: 'value' });

      expect(values.get(multiKey)).toEqual(['value']);
    });
    it('throws if there is no default value', () => {
      expect(() => values.get(new MultiContextKey(multiKey.name, () => null))).toThrowError();
    });
    it('is associated with empty array by default', () => {
      expect(values.get(new MultiContextKey(multiKey.name))).toEqual([]);
    });
    it('is associated with default value is there is no value', () => {
      expect(values.get(new MultiContextKey<string>(multiKey.name), { or: ['default'] })).toEqual(['default']);
    });
    it('is associated with key default value is there is no value', () => {
      expect(values.get(new MultiContextKey<string>(multiKey.name, () => ['default']))).toEqual(['default']);
    });
    it('prefers fallback value over default one', () => {
      expect(values.get(
          new MultiContextKey<string>(
              multiKey.name,
              () => ['key', 'default']),
          { or: ['explicit', 'default'] }))
          .toEqual(['explicit', 'default']);
    });
    it('prefers `null` fallback value over default one', () => {
      expect(values.get(new MultiContextKey<string>(multiKey.name, () => ['key', 'default']), { or: null }))
          .toBeNull();
    });
    it('prefers `undefined` fallback value over default one', () => {
      expect(values.get(new MultiContextKey<string>(multiKey.name, () => ['key', 'default']), { or: undefined }))
          .toBeUndefined();
    });
  });

  describe('Providers combination', () => {

    let provider2Spy: Mock;

    beforeEach(() => {
      provider2Spy = jest.fn();
      registry.provide({ a: key, by: provider2Spy });
    });

    it('provides the last constructed value', () => {
      providerSpy.mockReturnValue('value1');
      provider2Spy.mockReturnValue('value2');

      expect(values.get(key)).toBe('value2');
    });
    it('provides the first constructed value if the second one is undefined', () => {
      providerSpy.mockReturnValue('value1');

      expect(values.get(key)).toBe('value1');
    });
    it('provides the first constructed value if the second one is null', () => {
      providerSpy.mockReturnValue('value1');
      provider2Spy.mockReturnValue(null);

      expect(values.get(key)).toBe('value1');
    });
  });

  function testChained(title: string, createChained: () => ContextRegistry) {
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

        providerSpy.mockReturnValue(value1);

        chained.provide({a: key, by: provider2Spy});
        provider2Spy.mockReturnValue(value2);

        expect(chainedValues.get(key)).toBe(value2);
      });
      it('falls back to initial value', () => {

        const value1 = 'initial value';

        providerSpy.mockReturnValue(value1);

        chained.provide({a: key, by: provider2Spy});
        provider2Spy.mockReturnValue(null);

        expect(chainedValues.get(key)).toBe(value1);
      });
    });
  }

  testChained(
      'Registry chained with bound sources',
      () => new ContextRegistry(registry.bindSources({ name: 'context' } as any)));
  testChained(
      'Registry chained with context values',
      () => new ContextRegistry(values));

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

    let registry2: ContextRegistry<ContextValues>;
    let combined: ContextRegistry<ContextValues>;
    let context: ContextValues;

    beforeEach(() => {
      registry2 = new ContextRegistry();
      combined = registry.append(registry2);
      context = { name: 'context' } as any;
    });

    it('contains all sources', () => {
      providerSpy.mockReturnValue('1');
      registry2.provide({ a: key, is: '2' });
      registry2.provide({ a: key, is: '3' });
      expect([...combined.sources(context, key)]).toEqual(['1', '2', '3']);
    });
    it('contains reverted sources', () => {
      providerSpy.mockReturnValue('1');
      registry2.provide({ a: key, is: '2' });
      registry2.provide({ a: key, is: '3' });
      expect([...combined.sources(context, key).reverse()]).toEqual(['3', '2', '1']);
    });
  });

});
