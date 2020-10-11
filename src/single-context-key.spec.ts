import { noop } from '@proc7ts/primitives';
import { ContextKeyError } from './context-key-error';
import { ContextRegistry } from './context-registry';
import type { ContextValues } from './context-values';
import { SingleContextKey } from './single-context-key';

describe('SingleContextKey', () => {

  let registry: ContextRegistry;
  let values: ContextValues;

  beforeEach(() => {
    registry = new ContextRegistry();
    values = registry.newValues();
  });

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
    expect(() => values.get(new SingleContextKey(key.name))).toThrow(ContextKeyError);
    expect(() => values.get(new SingleContextKey(key.name), {})).toThrow(ContextKeyError);
  });
  it('provides fallback value if there is no provider', () => {
    expect(values.get(new SingleContextKey<string>(key.name), { or: 'fallback' })).toBe('fallback');
  });
  it('provides default value if no value provided', () => {

    const defaultValue = 'default';
    const byDefault = jest.fn(() => defaultValue);
    const keyWithDefaults = new SingleContextKey(key.name, { byDefault });

    registry.provide({ a: keyWithDefaults, is: null });

    expect(values.get(keyWithDefaults)).toBe(defaultValue);
    expect(byDefault).toHaveBeenCalledWith(values, keyWithDefaults);
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

  describe('combination seed key', () => {

    let registry2: ContextRegistry;
    let combined: ContextRegistry;
    let context: ContextValues;

    beforeEach(() => {
      registry2 = new ContextRegistry();
      combined = registry.append(registry2);
      context = { name: 'context', get: combined.newValues().get } as any;
    });

    it('contains the most recent source', () => {
      registry.provide({ a: key, is: '1' });
      registry2.provide({ a: key, is: '2' });
      registry2.provide({ a: key, is: '3' });

      expect(combined.seed(context, key.seedKey)()).toBe('3');
    });
    it('accesses only the most recent source', () => {

      const provider1 = jest.fn(() => '1');

      registry.provide({ a: key, by: provider1 });

      const provider2 = jest.fn(() => '2').mockName('provider2');

      registry2.provide({ a: key, by: provider2 });
      expect(context.get(key.seedKey)()).toBe('2');
      expect(provider1).not.toHaveBeenCalled();
      expect(provider2).toHaveBeenCalledTimes(1);
    });
    it('contains the first source if the second one is absent', () => {
      registry.provide({ a: key, is: '1' });
      expect(context.get(key.seedKey)()).toBe('1');
    });
    it('contains the second source if the first one is absent', () => {
      registry2.provide({ a: key, is: '2' });
      expect(context.get(key.seedKey)()).toBe('2');
    });
    it('contains nothing when sources are empty', () => {
      registry.provide({ a: key, is: null });
      registry2.provide({ a: key, is: null });
      expect(context.get(key.seedKey)()).toBeUndefined();
    });

    describe('when the second seed is absent', () => {
      it('uses the first one', () => {
        combined = registry.append(noop);
        registry.provide({ a: key, is: '1' });
        registry2.provide({ a: key, is: '2' });

        expect(combined.seed(context, key.seedKey)()).toBe('1');
      });
    });
  });
});
