import { AfterEvent, afterEventOf } from 'fun-events';
import { ContextKeyError } from './context-key-error';
import { ContextRegistry } from './context-registry';
import { MultiContextUpKey, SingleContextUpKey } from './context-up-key';
import { ContextValues } from './context-values';

describe('ContextUpKey', () => {

  let registry: ContextRegistry<ContextValues>;
  let values: ContextValues;

  beforeEach(() => {
    registry = new ContextRegistry();
    values = registry.newValues();
  });

  describe('SingleContextUpKey', () => {

    let key: SingleContextUpKey<string>;

    beforeEach(() => {
      key = new SingleContextUpKey('test-key');
    });

    it('provides a value specified verbatim', () => {

      const value = 'test value';

      registry.provide({ a: key, is: value });
      expect(readValue(values.get(key))).toBe(value);
    });
    it('provides a value specified by event keeper', () => {

      const value = 'test value';

      registry.provide({ a: key, is: afterEventOf(value) });
      expect(readValue(values.get(key))).toBe(value);
    });
    it('selects the last value if more than one provided', () => {

      const value1 = 'value1';
      const value2 = 'value2';

      registry.provide({ a: key, is: value1 });
      registry.provide({ a: key, is: value2 });

      expect(readValue(values.get(key))).toBe(value2);
    });
    it('removes the value specifier', () => {

      const value1 = 'value1';
      const value2 = 'value2';

      registry.provide({ a: key, is: value1 });
      registry.provide({ a: key, is: value2 })();

      expect(readValue(values.get(key))).toBe(value1);
    });
    it('updates the value when specifier removed', () => {

      const value1 = 'value1';
      const value2 = 'value2';

      registry.provide({ a: key, is: value1 });

      const remove = registry.provide({ a: key, is: value2 });

      expect(readValue(values.get(key))).toBe(value2);

      remove();
      remove();
      expect(readValue(values.get(key))).toBe(value1);
    });
    it('throws if there is neither default nor fallback value', () => {
      expect(() => readValue(values.get(key))).toThrowError(ContextKeyError);
      expect(() => readValue(values.get(key, {})!)).toThrowError(ContextKeyError);
    });
    it('throws if fallback value is `null`', () => {
      expect(() => readValue(values.get(key, { or: null })!)).toThrowError(ContextKeyError);
    });
    it('throws if fallback value is `undefined`', () => {
      expect(() => readValue(values.get(key, { or: undefined })!)).toThrowError(ContextKeyError);
    });
    it('provides fallback value if there is no provider', () => {
      expect(readValue(values.get(key, { or: afterEventOf('fallback') }))).toBe('fallback');
    });
    it('provides default value if provider did not provide any value', () => {

      const defaultValue = 'default';
      const keyWithDefaults = new SingleContextUpKey<string>(key.name, { byDefault: () => defaultValue });

      registry.provide({ a: keyWithDefaults, is: null });

      expect(readValue(values.get(keyWithDefaults))).toBe(defaultValue);
    });

    function readValue<Value>(from: AfterEvent<[Value]>): Value {

      let received: Value = undefined!;

      from.once(value => received = value);

      return received;
    }
  });

  describe('MultiContextUpKey', () => {

    let key: MultiContextUpKey<string>;

    beforeEach(() => {
      key = new MultiContextUpKey('values');
    });

    it('is associated with empty array by default', () => {
      expect(readValue(values.get(key))).toHaveLength(0);
    });
    it('is associated with default value if there is no provider', () => {

      const defaultValue = ['default'];
      const keyWithDefaults = new MultiContextUpKey('key', { byDefault: () => defaultValue });

      expect(readValue(values.get(keyWithDefaults))).toEqual(defaultValue);
    });
    it('is associated with default value if providers did not return any values', () => {

      const defaultValue = ['default'];
      const keyWithDefaults = new MultiContextUpKey('key', { byDefault: () => defaultValue });

      registry.provide({ a: keyWithDefaults, is: null });
      registry.provide({ a: keyWithDefaults, is: undefined });

      expect(readValue(values.get(keyWithDefaults))).toEqual(defaultValue);
    });
    it('is associated with provided values array', () => {
      registry.provide({ a: key, is: 'a' });
      registry.provide({ a: key, is: undefined });
      registry.provide({ a: key, is: 'c' });

      expect(readValue(values.get(key))).toEqual(['a', 'c']);
    });
    it('is associated with value', () => {
      registry.provide({ a: key, is: 'value' });

      expect(readValue(values.get(key))).toEqual(['value']);
    });
    it('is associated with fallback value if there is no value provided', () => {
      expect(readValue(values.get(key, { or: afterEventOf('fallback') }))).toEqual(['fallback']);
    });
    it('prefers fallback value over default one', () => {
      expect(readValue(
          values.get(
              new MultiContextUpKey<string>(
                  key.name,
                  { byDefault: () => ['default', 'value'] }
              ),
              { or: afterEventOf('fallback', 'value') },
          )
      )).toEqual(['fallback', 'value']);
    });
    it('throws if fallback value is `null`', () => {
      expect(() => readValue(values.get(key, { or: null })!)).toThrowError(ContextKeyError);
    });
    it('throws if fallback value is `undefined`', () => {
      expect(() => readValue(values.get(key, { or: undefined })!)).toThrowError(ContextKeyError);
    });

    function readValue<Src>(from: AfterEvent<Src[]>): Src[] {

      let received: Src[] = undefined!;

      from.once((...value) => received = value);

      return received;
    }
  });
});
