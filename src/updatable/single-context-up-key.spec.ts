import { AfterEvent, afterThe, eventSupply } from '@proc7ts/fun-events';
import { ContextKeyError } from '../context-key-error';
import { ContextRegistry } from '../context-registry';
import type { ContextValues } from '../context-values';
import { ContextSupply } from './context-supply';
import { SingleContextUpKey } from './single-context-up-key';

describe('SingleContextUpKey', () => {

  let registry: ContextRegistry;
  let values: ContextValues;

  beforeEach(() => {
    registry = new ContextRegistry();
    values = registry.newValues();
  });

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

    registry.provide({ a: key, is: afterThe(value) });
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
  it('cuts off the value supply after context destruction', () => {

    const value = 'test value';
    const contextSupply = eventSupply();

    registry.provide({ a: ContextSupply, is: contextSupply });
    registry.provide({ a: key, is: value });

    const receiver = jest.fn();
    const whenOff = jest.fn();

    values.get(key).to(receiver).whenOff(whenOff);
    expect(receiver).toHaveBeenCalledWith(value);

    const reason = new Error('reason');

    contextSupply.off(reason);
    expect(whenOff).toHaveBeenCalledWith(reason);
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
    expect(() => readValue(values.get(key))).toThrow(ContextKeyError);
    expect(() => readValue(values.get(key, {})!)).toThrow(ContextKeyError);
  });
  it('throws if fallback value is `null`', () => {
    expect(() => readValue(values.get(key, { or: null })!)).toThrow(ContextKeyError);
  });
  it('throws if fallback value is `undefined`', () => {
    expect(() => readValue(values.get(key, { or: undefined })!)).toThrow(ContextKeyError);
  });
  it('provides fallback value if there is no provider', () => {
    expect(readValue(values.get(key, { or: afterThe('fallback') }))).toBe('fallback');
  });
  it('provides default value if not provided', () => {

    const defaultValue = 'default';
    const byDefault = jest.fn(() => defaultValue);
    const keyWithDefaults = new SingleContextUpKey<string>(key.name, { byDefault });

    registry.provide({ a: keyWithDefaults, is: null });

    expect(readValue(values.get(keyWithDefaults))).toBe(defaultValue);
    expect(byDefault).toHaveBeenCalledWith(values, keyWithDefaults);
  });

  describe('upKey', () => {
    it('is the key itself', () => {
      expect(key.upKey).toBe(key);
    });
  });

  describe('seedKey', () => {
    describe('upKey', () => {
      it('is a seed key itself', () => {
        expect(key.seedKey.upKey).toBe(key.seedKey);
      });
    });
  });

  function readValue<TValue>(from: AfterEvent<[TValue]>): TValue {

    let received: TValue = undefined!;

    from.once(value => received = value);

    return received;
  }

});
