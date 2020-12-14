import { AfterEvent, afterThe, firstEvent } from '@proc7ts/fun-events';
import { Supply } from '@proc7ts/primitives';
import { ContextKeyError } from '../context-key-error';
import { ContextRegistry } from '../context-registry';
import type { ContextValues } from '../context-values';
import { ContextSupply } from './context-supply';
import type { ContextUpKey } from './context-up-key';
import { MultiContextUpKey } from './multi-context-up-key';

describe('MultiContextUpKey', () => {

  let registry: ContextRegistry;
  let values: ContextValues;

  beforeEach(() => {
    registry = new ContextRegistry();
    values = registry.newValues();
  });

  let key: MultiContextUpKey<string>;

  beforeEach(() => {
    key = new MultiContextUpKey('values');
  });

  it('provides empty array by default', () => {
    expect(readValue(values.get(key))).toHaveLength(0);
  });
  it('provides default value if there is no provider', () => {

    const defaultValue = ['default'];
    const keyWithDefaults = new MultiContextUpKey('key', { byDefault: () => defaultValue });

    expect(readValue(values.get(keyWithDefaults))).toEqual(defaultValue);
  });
  it('provides default value if providers did not return any values', () => {

    const defaultValue = ['default'];
    const byDefault = jest.fn(
        (_values: ContextValues, _key: ContextUpKey<AfterEvent<string[]>, string>) => defaultValue,
    );
    const keyWithDefaults = new MultiContextUpKey('key', { byDefault });

    registry.provide({ a: keyWithDefaults, is: null });
    registry.provide({ a: keyWithDefaults, is: undefined });

    expect(readValue(values.get(keyWithDefaults))).toEqual(defaultValue);
    expect(byDefault).toHaveBeenCalledWith(values, keyWithDefaults);
  });
  it('provides an array of values', () => {
    registry.provide({ a: key, is: 'a' });
    registry.provide({ a: key, is: undefined });
    registry.provide({ a: key, is: 'c' });

    expect(readValue(values.get(key))).toEqual(['a', 'c']);
  });
  it('provides an array of single value', () => {
    registry.provide({ a: key, is: 'value' });

    expect(readValue(values.get(key))).toEqual(['value']);
  });
  it('provides fallback value if there is no value provided', () => {
    expect(readValue(values.get(key, { or: afterThe('fallback') }))).toEqual(['fallback']);
  });
  it('prefers fallback value over default one', () => {
    expect(readValue(
        values.get(
            new MultiContextUpKey<string>(
                key.name,
                { byDefault: () => ['default', 'value'] },
            ),
            { or: afterThe('fallback', 'value') },
        ),
    )).toEqual(['fallback', 'value']);
  });
  it('throws if fallback value is `null`', () => {
    expect(() => readValue(values.get(key, { or: null })!)).toThrow(ContextKeyError);
  });
  it('throws if fallback value is `undefined`', () => {
    expect(() => readValue(values.get(key, { or: undefined })!)).toThrow(ContextKeyError);
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

  describe('upKey', () => {
    it('is the key itself', () => {
      expect(key.upKey).toBe(key);
    });
  });

  function readValue<TSrc>(from: AfterEvent<TSrc[]>): TSrc[] {

    let received: TSrc[] = undefined!;

    from.do(firstEvent)((...value) => received = value);

    return received;
  }
});
