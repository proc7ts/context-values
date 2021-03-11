import { AfterEvent, afterThe, onceAfter } from '@proc7ts/fun-events';
import { asis } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { ContextKeyError } from '../context-key-error';
import type { ContextValues } from '../context-values';
import { ContextSupply } from '../conventional';
import { ContextRegistry } from '../registry';
import type { ContextUpKey } from './context-up-key';
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
    registry.provide({ a: key, is: value2 }).off();

    expect(readValue(values.get(key))).toBe(value1);
  });
  it('cuts off the value supply after context destruction', () => {

    const value = 'test value';
    const contextSupply = new Supply();

    registry.provide({ a: ContextSupply, is: contextSupply });
    registry.provide({ a: key, is: value });

    const receiver = jest.fn();
    const whenOff = jest.fn();

    values.get(key)(receiver).whenOff(whenOff);
    expect(receiver).toHaveBeenCalledWith(value);

    const reason = new Error('reason');

    contextSupply.off(reason);
    expect(whenOff).toHaveBeenCalledWith(reason);
  });
  it('updates the value when specifier removed', () => {

    const value1 = 'value1';
    const value2 = 'value2';

    registry.provide({ a: key, is: value1 });

    const supply = registry.provide({ a: key, is: value2 });

    expect(readValue(values.get(key))).toBe(value2);

    supply.off();
    expect(readValue(values.get(key))).toBe(value1);
  });
  it('cuts off the value supply if there is neither default nor fallback value', async () => {
    expect(await Promise.resolve(values.get(key)).catch(asis)).toBeInstanceOf(ContextKeyError);
    expect(await Promise.resolve(values.get(key, {})).catch(asis)).toBeInstanceOf(ContextKeyError);
  });
  it('cuts off the value supply if fallback value is `null`', async () => {
    expect(await Promise.resolve(values.get(key, { or: null })).catch(asis)).toBeInstanceOf(ContextKeyError);
  });
  it('cuts off the value supply if fallback value is `undefined`', async () => {
    expect(await Promise.resolve(values.get(key, { or: undefined })).catch(asis)).toBeInstanceOf(ContextKeyError);
  });
  it('provides fallback value if there is no provider', () => {
    expect(readValue(values.get(key, { or: afterThe('fallback') }))).toBe('fallback');
  });
  it('provides default value if not provided', () => {

    const defaultValue = 'default';
    const byDefault = jest.fn(
        (_values: ContextValues, _key: ContextUpKey<AfterEvent<[string]>, string>) => defaultValue,
    );
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

    from.do(onceAfter)(value => received = value);

    return received;
  }

});
