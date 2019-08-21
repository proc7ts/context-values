import { ContextKeyError } from './context-key-error';
import { ContextRegistry } from './context-registry';
import { ContextValues } from './context-values';
import { MultiContextKey, SingleContextKey } from './simple-context-key';

describe('SimpleContextKey', () => {

  let registry: ContextRegistry<ContextValues>;
  let values: ContextValues;

  beforeEach(() => {
    registry = new ContextRegistry();
    values = registry.newValues();
  });

  describe('SingleContextKey', () => {

    let key: SingleContextKey<string>;

    beforeEach(() => {
      key = new SingleContextKey('test-key');
    });

    it('provides value', () => {

      const value = 'test value';

      registry.provide({ a: key, is: value });

      expect(values.get(key)).toBe(value);
    });
    it('selects the last value if more than one provided', () => {

      const value1 = 'value1';
      const value2 = 'value2';

      registry.provide({ a: key, is: value1 });
      registry.provide({ a: key, is: value2 });

      expect(values.get(key)).toBe(value2);
    });
    it('removes the value specifier', () => {

      const value1 = 'value1';
      const value2 = 'value2';

      registry.provide({ a: key, is: value1 });
      registry.provide({ a: key, is: value2 })();

      expect(values.get(key)).toBe(value1);
    });
    it('retains the constructed value when specifier removed', () => {

      const value1 = 'value1';
      const value2 = 'value2';

      registry.provide({ a: key, is: value1 });

      const remove = registry.provide({ a: key, is: value2 });

      expect(values.get(key)).toBe(value2);

      remove();
      remove();
      expect(values.get(key)).toBe(value2);
    });
    it('throws if there is neither default nor fallback value', () => {
      expect(() => values.get(new SingleContextKey(key.name))).toThrowError(ContextKeyError);
      expect(() => values.get(new SingleContextKey(key.name), {})).toThrowError(ContextKeyError);
    });
    it('provides fallback value if there is no provider', () => {
      expect(values.get(new SingleContextKey<string>(key.name), { or: 'fallback' })).toBe('fallback');
    });
    it('provides default value if provider did not provide any value', () => {

      const defaultValue = 'default';
      const keyWithDefaults = new SingleContextKey(key.name, { byDefault: () => defaultValue });

      registry.provide({ a: keyWithDefaults, is: null });

      expect(values.get(keyWithDefaults)).toBe(defaultValue);
    });
    it('provides default value if there is no provider', () => {
      expect(values.get(new SingleContextKey<string>(key.name, { byDefault: () => 'default' }))).toBe('default');
    });
    it('prefers fallback value over default one', () => {
      expect(values.get(new SingleContextKey<string>(key.name, { byDefault: () => 'default' }), { or: 'fallback' }))
          .toBe('fallback');
    });
    it('prefers default value if fallback one is absent', () => {
      expect(values.get(new SingleContextKey<string>(key.name, { byDefault: () => 'default' }), {}))
          .toBe('default');
    });
    it('prefers `null` fallback value over key one', () => {
      expect(values.get(new SingleContextKey<string>(key.name, { byDefault: () => 'default' }), { or: null }))
          .toBeNull();
    });
    it('prefers `undefined` fallback value over key one', () => {
      expect(values.get(new SingleContextKey<string>(key.name, { byDefault: () => 'default' }), { or: undefined }))
          .toBeUndefined();
    });
    it('caches the value', () => {

      const value = 'value';
      const mockProvider = jest.fn(() => value);

      registry.provide({ a: key, by: mockProvider });

      expect(values.get(key)).toBe(value);
      expect(values.get(key)).toBe(value);

      expect(mockProvider).toHaveBeenCalledTimes(1);
    });
    it('caches default value', () => {

      const value = 'default value';
      const defaultProviderSpy = jest.fn(() => value);
      const keyWithDefault = new SingleContextKey('key-with-default', { byDefault: defaultProviderSpy });

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
    it('rebuilds the value in another context', () => {

      const value1 = 'value1';
      const value2 = 'value2';
      const mockProvider = jest.fn(() => value1);

      registry.provide({ a: key, by: mockProvider });
      expect(values.get(key)).toBe(value1);

      const values2 = registry.newValues();

      mockProvider.mockReturnValue(value2);
      expect(values.get(key)).toBe(value1);
      expect(values2.get(key)).toBe(value2);

      expect(mockProvider).toHaveBeenCalledTimes(2);
    });
  });

  describe('MultiContextKey', () => {

    let key: MultiContextKey<string>;

    beforeEach(() => {
      key = new MultiContextKey('values');
    });

    it('is associated with empty array by default', () => {
      expect(values.get(key)).toEqual([]);
    });
    it('is associated with empty array if providers did not return any values', () => {
      registry.provide({ a: key, is: null });
      registry.provide({ a: key, is: undefined });

      expect(values.get(key)).toEqual([]);
    });
    it('is associated with default value if there is no provider', () => {

      const defaultValue = ['default'];
      const keyWithDefaults = new MultiContextKey('key', { byDefault: () => defaultValue });

      expect(values.get(keyWithDefaults)).toEqual(defaultValue);
    });
    it('is associated with default value if providers did not return any values', () => {

      const defaultValue = ['default'];
      const keyWithDefaults = new MultiContextKey('key', { byDefault: () => defaultValue });

      registry.provide({ a: keyWithDefaults, is: null });
      registry.provide({ a: keyWithDefaults, is: undefined });

      expect(values.get(keyWithDefaults)).toEqual(defaultValue);
    });
    it('is associated with provided values array', () => {
      registry.provide({ a: key, is: 'a' });
      registry.provide({ a: key, is: undefined });
      registry.provide({ a: key, is: 'c' });

      expect(values.get(key)).toEqual(['a', 'c']);
    });
    it('is associated with value', () => {
      registry.provide({ a: key, is: 'value' });

      expect(values.get(key)).toEqual(['value']);
    });
    it('is associated with fallback value if there is no value provided', () => {
      expect(values.get(key, { or: ['fallback'] })).toEqual(['fallback']);
    });
    it('throws if there is no default value', () => {
      expect(() => values.get(new MultiContextKey(key.name, { byDefault: () => null }))).toThrowError();
    });
    it('prefers fallback value over default one', () => {
      expect(
          values.get(
              new MultiContextKey<string>(
                  key.name,
                  { byDefault: () => ['default', 'value'] }
              ),
              { or: ['fallback', 'value'] },
          )
      ).toEqual(['fallback', 'value']);
    });
    it('prefers `null` fallback value over default one', () => {
      expect(values.get(
          new MultiContextKey<string>(key.name, { byDefault: () => ['default', 'value'] }),
          { or: null },
      )).toBeNull();
    });
    it('prefers `undefined` fallback value over default one', () => {
      expect(
          values.get(new MultiContextKey<string>(
              key.name,
              { byDefault: () => ['default', 'value'] }
              ),
              { or: undefined },
          )
      ).toBeUndefined();
    });
  });
});
