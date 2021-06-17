import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ContextValues } from '../context-values';
import type { ContextKey } from '../key';
import { ContextRegistry } from '../registry';
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

  it('provides empty array by default', () => {
    expect(values.get(key)).toEqual([]);
  });
  it('provides array if providers did not return any values', () => {
    registry.provide({ a: key, is: null });
    registry.provide({ a: key, is: undefined });

    expect(values.get(key)).toEqual([]);
  });
  it('provider default value if there is no provider', () => {

    const defaultValue = ['default'];
    const keyWithDefaults = new MultiContextKey('key', { byDefault: () => defaultValue });

    expect(values.get(keyWithDefaults)).toEqual(defaultValue);
  });
  it('provides default value if providers did not return any values', () => {

    const defaultValue = ['default'];
    const byDefault = jest.fn((_values: ContextValues, _key: ContextKey<readonly string[], string>) => defaultValue);
    const keyWithDefaults = new MultiContextKey('key', { byDefault });

    registry.provide({ a: keyWithDefaults, is: null });
    registry.provide({ a: keyWithDefaults, is: undefined });

    expect(values.get(keyWithDefaults)).toEqual(defaultValue);
    expect(byDefault).toHaveBeenCalledWith(values, keyWithDefaults);
  });
  it('provides multiple values', () => {
    registry.provide({ a: key, is: 'a' });
    registry.provide({ a: key, is: undefined });
    registry.provide({ a: key, is: 'c' });

    expect([...values.get(key)]).toEqual(['a', 'c']);
  });
  it('provides single value', () => {
    registry.provide({ a: key, is: 'value' });

    expect([...values.get(key)]).toEqual(['value']);
  });
  it('removes the value specifier', () => {

    const value1 = 'value1';
    const value2 = 'value2';

    registry.provide({ a: key, is: value1 });
    registry.provide({ a: key, is: value2 }).off();

    expect([...values.get(key)]).toEqual([value1]);
  });
  it('retains the constructed value when specifier removed', () => {

    const value1 = 'value1';
    const value2 = 'value2';

    registry.provide({ a: key, is: value1 });

    const supply = registry.provide({ a: key, is: value2 });

    expect([...values.get(key)]).toEqual(['value1', 'value2']);

    supply.off();
    expect([...values.get(key)]).toEqual(['value1', 'value2']);
  });
  it('provides fallback value if there is no value provided', () => {
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

  describe('combination', () => {

    let registry2: ContextRegistry;
    let combined: ContextRegistry;
    let context: ContextValues;

    beforeEach(() => {
      registry2 = new ContextRegistry();
      combined = registry.append(registry2);
      context = { name: 'context', get: combined.newValues().get } as any;
    });

    it('contains all sources', () => {
      registry.provide({ a: key, is: '1' });
      registry2.provide({ a: key, is: '2' });
      registry2.provide({ a: key, is: '3' });

      expect([...combined.seed(context, key.seedKey)]).toEqual(['1', '2', '3']);
    });
    it('accesses sources only once', () => {

      const provider = jest.fn(() => '1');

      registry.provide({ a: key, by: provider });

      const provider2 = jest.fn(() => '2').mockName('provider2');

      registry2.provide({ a: key, by: provider2 });
      expect([...context.get(key.seedKey)]).toEqual(['1', '2']);
      expect(provider).toHaveBeenCalledTimes(1);
      expect(provider2).toHaveBeenCalledTimes(1);
    });
  });
});
