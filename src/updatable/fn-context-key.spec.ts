import { ContextKeyError } from '../context-key-error';
import { ContextRegistry } from '../context-registry';
import { ContextValues } from '../context-values';
import { FnContextKey } from './fn-context-key';

describe('FnContextKey', () => {

  let registry: ContextRegistry<ContextValues>;
  let values: ContextValues;
  let key: FnContextKey<[string], number>;

  beforeEach(() => {
    registry = new ContextRegistry();
    values = registry.newValues();
    key = new FnContextKey('test-fn');
  });

  it('delegates to function', () => {
    registry.provide({ a: key, is: value => value.length });
    expect(values.get(key)('some')).toEqual(4);
  });
  it('delegates to updated function', () => {
    registry.provide({ a: key, is: value => value.length });
    expect(values.get(key)('some')).toEqual(4);
    registry.provide({ a: key, is: value => value.length + 100 });
    expect(values.get(key)('some')).toEqual(104);
  });
  it('delegates to fallback function when absent', () => {
    expect(values.get(key, { or: value => value.length })('some')).toEqual(4);
  });
  it('does not throw when no function to delegate', () => {
    expect(values.get(key)).toBeInstanceOf(Function);
  });
  it('throws when absent delegate called', () => {
    expect(() => values.get(key)('some')).toThrow(ContextKeyError);
  });
  it('throws when absent delegate called with `null` fallback', () => {
    expect(() => values.get(key, { or: null })!('some')).toThrow(ContextKeyError);
  });

  describe('upKey', () => {
    it('reports the same function', () => {
      registry.provide({ a: key, is: value => value.length });

      let fn!: (arg: string) => number;
      const receiver = jest.fn(f => fn = f);

      values.get(key.upKey)(receiver);
      expect(receiver).toHaveBeenCalledTimes(1);
      expect(fn('some')).toEqual(4);

      registry.provide({ a: key, is: value => value.length * 2 });
      expect(receiver).toHaveBeenCalledTimes(2);
      expect(fn('other')).toEqual(10);
    });
  });
});
