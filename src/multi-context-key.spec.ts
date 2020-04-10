import { ContextRegistry } from './context-registry';
import { ContextValues } from './context-values';
import { MultiContextKey } from './multi-context-key';

describe('MultiContextKey', () => {

  let registry: ContextRegistry;
  let values: ContextValues;

  beforeEach(() => {
    registry = new ContextRegistry();
    values = registry.newValues();
  });

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
    const byDefault = jest.fn(() => defaultValue);
    const keyWithDefaults = new MultiContextKey('key', { byDefault });

    registry.provide({ a: keyWithDefaults, is: null });
    registry.provide({ a: keyWithDefaults, is: undefined });

    expect(values.get(keyWithDefaults)).toEqual(defaultValue);
    expect(byDefault).toHaveBeenCalledWith(values, keyWithDefaults);
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
    expect(() => values.get(new MultiContextKey(key.name, { byDefault: () => null }))).toThrow();
  });
  it('prefers fallback value over default one', () => {
    expect(
        values.get(
            new MultiContextKey<string>(
                key.name,
                { byDefault: () => ['default', 'value'] },
            ),
            { or: ['fallback', 'value'] },
        ),
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
        values.get(
            new MultiContextKey<string>(
                key.name,
                { byDefault: () => ['default', 'value'] },
            ),
            { or: undefined },
        ),
    ).toBeUndefined();
  });
});
