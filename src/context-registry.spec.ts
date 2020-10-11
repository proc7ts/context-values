import { valueProvider } from '@proc7ts/primitives';
import type { ContextKey, ContextValueSetup, ContextValueSlot } from './context-key';
import { ContextKeyError } from './context-key-error';
import { ContextRegistry } from './context-registry';
import type { ContextValues } from './context-values';
import { MultiContextKey } from './multi-context-key';
import type { SimpleContextKey } from './simple-context-key';
import { SingleContextKey } from './single-context-key';
import Mock = jest.Mock;

describe('ContextRegistry', () => {

  const key = new SingleContextKey<string>('test-key');
  const multiKey = new MultiContextKey<string>('test-key');
  let registry: ContextRegistry;
  let values: ContextValues;
  let mockProvider: Mock<string>;

  beforeEach(() => {
    registry = new ContextRegistry();
    values = registry.newValues();
    mockProvider = jest.fn().mockName('mockProvider');
    registry.provide({ a: key, by: mockProvider });
    registry.provide({ a: multiKey, by: mockProvider });
  });

  describe('Value seed request', () => {
    it('empty seed by default', () => {
      expect(values.get(key.seedKey)()).toBeUndefined();
      expect([...values.get(multiKey.seedKey)]).toEqual([]);
    });
    it('respects seed fallback', () => {
      expect(values.get(key.seedKey, { or: valueProvider('default') })()).toBe('default');
      expect([...values.get(multiKey.seedKey, { or: ['default'] })]).toEqual(['default']);
    });
    it('prefers explicit seed', () => {

      const value = 'test value';

      mockProvider.mockReturnValue(value);

      expect(values.get(key.seedKey, { or: valueProvider('default') })()).toBe(value);
      expect([...values.get(multiKey.seedKey, { or: ['default'] })]).toEqual([value]);
    });
    it('caches value seed', () => {

      const value = 'test value';

      mockProvider.mockReturnValue(value);

      expect(values.get(key.seedKey)()).toBe(value);
      expect([...values.get(multiKey.seedKey)]).toEqual([value]);
      expect(values.get(key)).toBe(value);
      expect([...values.get(multiKey)]).toEqual([value]);

      mockProvider.mockReturnValue('other');

      expect(values.get(key.seedKey)()).toBe(value);
      expect([...values.get(multiKey.seedKey)]).toEqual([value]);
      expect(values.get(key)).toBe(value);
      expect([...values.get(multiKey)]).toEqual([value]);
    });
  });

  describe('Providers combination', () => {

    let provider2Spy: Mock;

    beforeEach(() => {
      provider2Spy = jest.fn();
      registry.provide({ a: key, by: provider2Spy });
    });

    it('provides the last constructed value', () => {
      mockProvider.mockReturnValue('value1');
      provider2Spy.mockReturnValue('value2');

      expect(values.get(key)).toBe('value2');
    });
    it('provides the first constructed value if the second one is undefined', () => {
      mockProvider.mockReturnValue('value1');

      expect(values.get(key)).toBe('value1');
    });
    it('provides the first constructed value if the second one is null', () => {
      mockProvider.mockReturnValue('value1');
      provider2Spy.mockReturnValue(null);

      expect(values.get(key)).toBe('value1');
    });
  });

  describe.each([
    ['Registry chained with bound seeds', () => new ContextRegistry(registry.seedIn({ name: 'context' } as any))],
    ['Registry chained with context values', () => new ContextRegistry(values)],
  ])('%s', (_title: string, createChained: () => ContextRegistry): void => {

    let chained: ContextRegistry;
    let chainedValues: ContextValues;
    let provider2Spy: Mock;

    beforeEach(() => {
      chained = createChained();
      chainedValues = chained.newValues();
      provider2Spy = jest.fn();
    });

    it('prefers explicit value', () => {

      const value1 = 'initial value';
      const value2 = 'actual value';

      mockProvider.mockReturnValue(value1);

      chained.provide({ a: key, by: provider2Spy });
      provider2Spy.mockReturnValue(value2);

      expect(chainedValues.get(key)).toBe(value2);
    });
    it('falls back to initial value', () => {

      const value1 = 'initial value';

      mockProvider.mockReturnValue(value1);

      chained.provide({ a: key, by: provider2Spy });
      provider2Spy.mockReturnValue(null);

      expect(chainedValues.get(key)).toBe(value1);
    });
  });

  describe('key setup', () => {

    let keyWithSetup: ContextKey<string>;
    let byDefault: jest.Mock<string | null | undefined, []>;
    let setup: jest.Mock<void, Parameters<ContextValueSetup<string, string, SimpleContextKey.Seed<string>>>>;

    beforeEach(() => {

      class TestKeyWithSetup extends SingleContextKey<string> {

        constructor() {
          super('test-key', { byDefault });
        }

        grow(slot: ContextValueSlot<string, string, SimpleContextKey.Seed<string>>): void {
          super.grow(slot);
          slot.setup(setup);
        }

      }

      byDefault = jest.fn();
      setup = jest.fn();
      keyWithSetup = new TestKeyWithSetup();
    });

    it('sets up the key for provided value only once', () => {
      registry.provide({ a: keyWithSetup, is: 'provided' });
      expect(values.get(keyWithSetup)).toBe('provided');
      expect(values.get(keyWithSetup)).toBe('provided');
      expect(setup).toHaveBeenCalledWith({ key: keyWithSetup, context: values, registry });
      expect(setup).toHaveBeenCalledTimes(1);
    });
    it('sets up the key for default value', () => {
      byDefault.mockImplementation(() => 'default');
      expect(values.get(keyWithSetup)).toBe('default');
      expect(values.get(keyWithSetup)).toBe('default');
      expect(setup).toHaveBeenCalledWith({ key: keyWithSetup, context: values, registry });
      expect(setup).toHaveBeenCalledTimes(1);
    });
    it('does not set up the key for fallback value', () => {
      expect(values.get(keyWithSetup, { or: null })).toBeNull();
      expect(setup).not.toHaveBeenCalled();
    });
    it('does not set up the key for absent value', () => {
      expect(() => values.get(keyWithSetup)).toThrow(ContextKeyError);
      expect(setup).not.toHaveBeenCalled();
    });
  });
});
