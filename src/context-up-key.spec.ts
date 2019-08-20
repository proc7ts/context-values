import { AfterEvent, afterEventOf } from 'fun-events';
import { ContextKeyError } from './context-key-error';
import { ContextRegistry } from './context-registry';
import { SingleContextUpKey } from './context-up-key';
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
  });

});

function readValue<Value>(from: AfterEvent<[Value]>): Value {

  let received: Value = undefined!;

  from.once(value => received = value);

  return received;
}
