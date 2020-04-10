import { AfterEvent, afterThe } from '@proc7ts/fun-events';
import { ContextKeyError } from '../context-key-error';
import { ContextRegistry } from '../context-registry';
import { ContextValues } from '../context-values';
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
    const byDefault = jest.fn(() => defaultValue);
    const keyWithDefaults = new MultiContextUpKey('key', { byDefault });

    registry.provide({ a: keyWithDefaults, is: null });
    registry.provide({ a: keyWithDefaults, is: undefined });

    expect(readValue(values.get(keyWithDefaults))).toEqual(defaultValue);
    expect(byDefault).toHaveBeenCalledWith(values, keyWithDefaults);
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

  describe('upKey', () => {
    it('is the key itself', () => {
      expect(key.upKey).toBe(key);
    });
  });

  function readValue<Src>(from: AfterEvent<Src[]>): Src[] {

    let received: Src[] = undefined!;

    from.once((...value) => received = value);

    return received;
  }
});
