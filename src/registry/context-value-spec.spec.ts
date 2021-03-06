import type { ContextRequest } from '../context-request';
import type { ContextValues } from '../context-values';
import { ContextKey, ContextKey__symbol } from '../key';
import { SingleContextKey } from '../singleton';
import { contextValueSpec, ContextValueSpec } from './context-value-spec';
import Mock = jest.Mock;

describe('contextValueSpec', () => {

  let contextSpy: {
    get: Mock<any, [ContextRequest<any>]>;
  };

  beforeEach(() => {
    contextSpy = {
      get: jest.fn(),
    };
  });

  it('uses provider as is', () => {

    const spec: ContextValueSpec.ByProvider<ContextValues, string> = {
      a: new SingleContextKey<string>('value'),
      by: () => 'foo',
    };

    expect(contextValueSpec(spec)).toBe(spec);
  });
  it('converts constant to provider', () => {

    const spec: ContextValueSpec.IsConstant<string> = {
      a: new SingleContextKey<string>('value'),
      is: 'foo',
    };
    const def = contextValueSpec(spec);

    expect(def.a).toBe(spec.a);
    expect(def.by(contextSpy)).toBe(spec.is);
  });
  it('converts alias ro provider', () => {

    const aliasKey = new SingleContextKey<string>('alias-key');
    const spec: ContextValueSpec.ViaAlias<string> = {
      a: new SingleContextKey<string>('value'),
      via: aliasKey,
    };
    const def = contextValueSpec(spec);

    const aliasValue = 'alias-value';

    contextSpy.get.mockImplementation((request: ContextRequest<any>) => {
      if (request[ContextKey__symbol] === aliasKey) {
        return aliasValue;
      }
      return;
    });

    expect(def.a).toBe(spec.a);
    expect(def.by(contextSpy)).toBe(aliasValue);
    expect(contextSpy.get).toHaveBeenCalledWith(aliasKey);
  });
  it('converts provider with dependencies to provider', () => {

    const key1 = new SingleContextKey<string>('arg1');
    const key2 = new SingleContextKey<number>('arg2');
    const spec: ContextValueSpec.ByProviderWithDeps<string, [string, number]> = {
      a: new SingleContextKey<string>('value'),
      by(first: string, second: number) {
        return `${first}.${second}`;
      },
      with: [key1, key2],
    };
    const def = contextValueSpec(spec);

    const arg1 = 'arg';
    const arg2 = 2;

    contextSpy.get.mockImplementation((request: ContextRequest<any>) => {
      if (request[ContextKey__symbol] === key1) {
        return arg1;
      }
      if (request[ContextKey__symbol] === key2) {
        return arg2;
      }
      return;
    });

    expect(def.a).toBe(spec.a);
    expect(def.by(contextSpy)).toBe(`${arg1}.${arg2}`);
    expect(contextSpy.get).toHaveBeenCalledWith(key1);
    expect(contextSpy.get).toHaveBeenCalledWith(key2);
  });
  describe('as instance', () => {

    let constructorSpy: Mock;
    class Value {

      static readonly [ContextKey__symbol]: ContextKey<Value> = new SingleContextKey('value');

      constructor(...args: any[]) {
        constructorSpy(...args);
      }

      get some(): string {
        return 'some';
      }

    }

    class Val implements Value {

      constructor(...args: any[]) {
        constructorSpy(...args);
      }

      get some(): string {
        return 'other';
      }

    }

    beforeEach(() => {
      constructorSpy = jest.fn();
    });

    it('converts class to provider', () => {

      const spec: ContextValueSpec.AsInstance<ContextValues, Value> = {
        a: Value,
        as: Val,
      };

      const def = contextValueSpec(spec);

      expect(def.a).toBe(spec.a);

      const value = def.by(contextSpy) as Value;

      expect(value).toBeInstanceOf(Val);
      expect(value.some).toBe('other');
      expect(constructorSpy).toHaveBeenCalledWith(contextSpy);
    });
    it('converts self class to provider', () => {

      const spec: ContextValueSpec.SelfInstance<ContextValues, Value> = { as: Value };
      const def = contextValueSpec(spec);

      expect(def.a).toBe(spec.as);

      const value = def.by(contextSpy) as Value;

      expect(value).toBeInstanceOf(Value);
      expect(value.some).toBe('some');
      expect(constructorSpy).toHaveBeenCalledWith(contextSpy);
    });
    it('converts class with dependencies to provider', () => {

      const key1 = new SingleContextKey<string>('arg1');
      const key2 = new SingleContextKey<number>('arg2');
      const spec: ContextValueSpec.AsInstanceWithDeps<Value, [string, number]> = {
        a: Value,
        as: Val,
        with: [key1, key2],
      };
      const def = contextValueSpec(spec);

      const arg1 = 'arg';
      const arg2 = 2;

      contextSpy.get.mockImplementation((request: ContextRequest<any>) => {
        if (request[ContextKey__symbol] === key1) {
          return arg1;
        }
        if (request[ContextKey__symbol] === key2) {
          return arg2;
        }
        return;
      });

      expect(def.a).toBe(spec.a);

      const value = def.by(contextSpy) as Value;

      expect(value).toBeInstanceOf(Val);
      expect(value.some).toBe('other');

      expect(constructorSpy).toHaveBeenCalledWith(arg1, arg2);
      expect(contextSpy.get).toHaveBeenCalledWith(key1);
      expect(contextSpy.get).toHaveBeenCalledWith(key2);
    });
    it('converts self class with dependencies to provider', () => {

      const key1 = new SingleContextKey<string>('arg1');
      const key2 = new SingleContextKey<number>('arg2');
      const spec: ContextValueSpec.SelfInstanceWithDeps<Value, [string, number]> = {
        as: Value,
        with: [key1, key2],
      };
      const def = contextValueSpec(spec);

      const arg1 = 'arg';
      const arg2 = 2;

      contextSpy.get.mockImplementation((request: ContextRequest<any>) => {
        if (request[ContextKey__symbol] === key1) {
          return arg1;
        }
        if (request[ContextKey__symbol] === key2) {
          return arg2;
        }
        return;
      });

      expect(def.a).toBe(spec.as);

      const value = def.by(contextSpy) as Value;

      expect(value).toBeInstanceOf(Value);
      expect(value.some).toBe('some');
      expect(constructorSpy).toHaveBeenCalledWith(arg1, arg2);
      expect(contextSpy.get).toHaveBeenCalledWith(key1);
      expect(contextSpy.get).toHaveBeenCalledWith(key2);
    });
  });
  it('throws on unsupported spec', () => {

    const spec: ContextValueSpec.Explicit<ContextValues, string> = {} as any;

    expect(() => contextValueSpec(spec)).toThrow(TypeError);
  });
});
