import { valueProvider } from '@proc7ts/primitives';
import type { ContextRequest } from '../context-request';
import type { ContextValues } from '../context-values';
import type { ContextBuilder } from './context-builder';
import type { ContextTarget } from './context-target';
import type { ContextValueProvider } from './context-value-provider';

/**
 * Context value specifier.
 *
 * Either explicit one, or a {@link ContextBuilder context builder}.
 *
 * @typeParam TCtx - Context type.
 * @typeParam TValue - Context value type.
 * @typeParam TSrc - Source value type.
 * @typeParam TDeps - Dependencies tuple type.
 */
export type ContextValueSpec<
    TCtx extends ContextValues,
    TValue,
    TSrc = TValue,
    TDeps extends any[] = unknown[]> =
    | ContextValueSpec.Explicit<TCtx, TValue, TSrc, TDeps>
    | ContextBuilder<TCtx>;

export namespace ContextValueSpec {

  /**
   * Explicit context value specifier.
   *
   * @typeParam TCtx - Context type.
   * @typeParam TValue - Context value type.
   * @typeParam TSrc - Source value type.
   * @typeParam TDeps - Dependencies tuple type.
   */
  export type Explicit<
      TCtx extends ContextValues,
      TValue,
      TSrc = TValue,
      TDeps extends any[] = unknown[]> =
      | ContextValueSpec.IsConstant<TSrc>
      | ContextValueSpec.ViaAlias<TSrc>
      | ContextValueSpec.ByProvider<TCtx, TSrc>
      | ContextValueSpec.ByProviderWithDeps<TSrc, TDeps>
      | ContextValueSpec.AsInstance<TCtx, TSrc>
      | ContextValueSpec.SelfInstance<TCtx, TSrc>
      | ContextValueSpec.AsInstanceWithDeps<TSrc, TDeps>
      | ContextValueSpec.SelfInstanceWithDeps<TSrc, TDeps>;

  /**
   * A specifier defining a context value is constant.
   *
   * @typeParam TSrc - Source value type.
   */
  export interface IsConstant<TSrc> {

    /**
     * Target value to define.
     */
    a: ContextTarget<TSrc>;

    /**
     * Constant context value.
     */
    is: TSrc;

  }

  /**
   * A specifier defining a context value via another one (alias).
   *
   * @typeParam TSrc - Source value type.
   */
  export interface ViaAlias<TSrc> {

    /**
     * Target value to define.
     */
    a: ContextTarget<TSrc>;

    /**
     * Context value request for the another value that will be used instead as provided one.
     */
    via: ContextRequest<TSrc>;

  }

  /**
   * A specifier of context value defined by provider function.
   *
   * @typeParam TCtx - Context type.
   * @typeParam TSrc - Source value type.
   */
  export interface ByProvider<TCtx extends ContextValues, TSrc> {

    /**
     * Target value to define.
     */
    a: ContextTarget<TSrc>;

    /**
     * Context value provider.
     */
    by: ContextValueProvider<TSrc, TCtx>;

  }

  /**
   * A specifier of context value defined by provider function depending on other context values.
   *
   * @typeParam TSrc - Source value type.
   * @typeParam TDeps - Dependencies tuple type.
   */
  export interface ByProviderWithDeps<TSrc, TDeps extends any[]> {

    /**
     * Target value to define.
     */
    a: ContextTarget<TSrc>;

    /**
     * Context value provider function.
     */
    by: (this: void, ...args: TDeps) => TSrc | null | undefined;

    /**
     * Context value requests for corresponding value provider function arguments.
     */
    with: DepsRequests<TDeps>;

  }

  /**
   * A specifier of context value defined as instance of some class.
   *
   * @typeParam TCtx - Context type.
   * @typeParam TSrc - Source value type.
   */
  export interface AsInstance<TCtx extends ContextValues, TSrc> {

    /**
     * Target value to define.
     */
    a: ContextTarget<TSrc>;

    /**
     * Context value class constructor.
     */
    as: new (context: TCtx) => TSrc;

  }

  /**
   * A specifier of context value defined as instance of the same class as value.
   *
   * @typeParam TCtx - Context type.
   * @typeParam TSrc - Source value type.
   */
  export interface SelfInstance<TCtx extends ContextValues, TSrc> {

    /**
     * Target value to define as its class constructor.
     */
    as: ContextTarget<TSrc> & (new (context: TCtx) => TSrc);

  }

  /**
   * A specifier of context value defined as instance of some class with constructor depending on other context values.
   *
   * @typeParam TDeps - Dependencies tuple type.
   * @typeParam TSrc - Source value type.
   */
  export interface AsInstanceWithDeps<TSrc, TDeps extends any[]> {

    /**
     * Target value to define.
     */
    a: ContextTarget<TSrc>;

    /**
     * Context value class constructor.
     */
    as: new (...args: TDeps) => TSrc;

    /**
     * Context value requests for corresponding constructor arguments.
     */
    with: DepsRequests<TDeps>;

  }

  /**
   * A specifier of context value defined as instance of the same class as value with constructor depending on other
   * context values.
   *
   * @typeParam TSrc - Source value type.
   * @typeParam TDeps - Dependencies tuple type.
   */
  export interface SelfInstanceWithDeps<TSrc, TDeps extends any[]> {

    /**
     * Target value to define as its class constructor.
     */
    as: ContextTarget<TSrc> & (new (...args: TDeps) => TSrc);

    /**
     * Context value requests for corresponding constructor arguments.
     */
    with: DepsRequests<TDeps>;

  }

  /**
   * Dependencies requests.
   *
   * This is a tuple of context value requests, each of which corresponds to dependency.
   *
   * @typeParam TDeps - Dependencies tuple type.
   */
  export type DepsRequests<TDeps extends any[]> = {
    [K in keyof TDeps]: ContextRequest<TDeps[K]>;
  };

}

/**
 * Constructs a specifier of context value defined by provider out of arbitrary one.
 *
 * @typeParam TCtx - Context type.
 * @typeParam TValue - Context value type.
 * @typeParam TSrc - Source value type.
 * @typeParam TDeps - Dependencies tuple type.
 * @param spec - Explicit context value specifier to convert.
 *
 * @returns A specifier of context value defined by provider function.
 *
 * @throws TypeError  On malformed context value specifier.
 */
export function contextValueSpec<TCtx extends ContextValues, TValue, TSrc, TDeps extends any[]>(
    spec: ContextValueSpec.Explicit<TCtx, TValue, TSrc, TDeps>,
): ContextValueSpec.ByProvider<TCtx, TSrc> {
  if (isValueSpecByProvider(spec)) {
    if (!isValueSpecWithDeps<TCtx, TSrc, TDeps>(spec)) {
      return spec;
    }

    const { a, by, with: deps } = spec;

    return {
      a,
      by(this: void, context: TCtx) {
        return by(...deps.map(<T>(dep: ContextRequest<T>) => context.get(dep)) as TDeps);
      },
    };
  }
  if (isConstantValueSpec<TSrc>(spec)) {

    const { a, is: value } = spec;

    return {
      a,
      by: valueProvider(value),
    };
  }
  if (isValueSpecViaAlias(spec)) {

    const { a, via } = spec;

    return {
      a,
      by(ctx: TCtx) {
        return ctx.get(via);
      },
    };
  }
  if (isValueSpecAsInstance<TCtx, TSrc, TDeps>(spec)) {
    if (isSelfInstanceValueSpec<TCtx, TSrc, TDeps>(spec)) {
      spec = toAsInstance(spec);
    }
    if (!isValueSpecWithDeps<TCtx, TSrc, TDeps>(spec)) {

      const { as: Type } = spec;

      return {
        a: spec.a,
        by(ctx: TCtx) {
          return new Type(ctx);
        },
      };
    }

    const { as: DepType, with: deps } = spec;

    return {
      a: spec.a,
      by(this: void, context: TCtx) {
        return new DepType(...deps.map(<T>(dep: ContextRequest<T>) => context.get(dep)) as TDeps);
      },
    };
  }

  throw new TypeError(`Malformed context value specifier: ${JSON.stringify(spec)}`);
}

/**
 * @internal
 */
function isValueSpecByProvider<TCtx extends ContextValues, TSrc, TDeps extends any[]>(
    spec: ContextValueSpec<TCtx, unknown, TSrc, TDeps>,
): spec is
    | ContextValueSpec.ByProvider<TCtx, TSrc>
    | ContextValueSpec.ByProviderWithDeps<TSrc, TDeps> {
  return 'by' in spec;
}

/**
 * @internal
 */
function isValueSpecAsInstance<TCtx extends ContextValues, TSrc, TDeps extends any[]>(
    spec: ContextValueSpec<TCtx, unknown, TSrc, TDeps>,
): spec is
    | ContextValueSpec.AsInstance<TCtx, TSrc>
    | ContextValueSpec.AsInstanceWithDeps<TSrc, TDeps> {
  return 'as' in spec;
}

/**
 * @internal
 */
function isSelfInstanceValueSpec<TCtx extends ContextValues, TSrc, TDeps extends any[]>(
    spec: ContextValueSpec<TCtx, unknown, TSrc, TDeps>,
): spec is
    | ContextValueSpec.SelfInstance<TCtx, TSrc>
    | ContextValueSpec.SelfInstanceWithDeps<TSrc, TDeps> {
  return !('a' in spec);
}

/**
 * @internal
 */
function toAsInstance<TCtx extends ContextValues, TSrc, TDeps extends any[]>(
    spec: ContextValueSpec.SelfInstance<TCtx, TSrc> | ContextValueSpec.SelfInstanceWithDeps<TSrc, TDeps>,
): ContextValueSpec.AsInstance<TCtx, TSrc> | ContextValueSpec.AsInstanceWithDeps<TSrc, TDeps> {
  return {
    ...spec,
    a: spec.as,
  } as ContextValueSpec.AsInstance<TCtx, TSrc> | ContextValueSpec.AsInstanceWithDeps<TSrc, TDeps>;
}

/**
 * @internal
 */
function isConstantValueSpec<TSrc>(
    spec: ContextValueSpec<any, unknown, TSrc, any>,
): spec is ContextValueSpec.IsConstant<TSrc> {
  return 'is' in spec;
}

/**
 * @internal
 */
function isValueSpecViaAlias<TSrc>(
    spec: ContextValueSpec<any, unknown, TSrc, any>,
): spec is ContextValueSpec.ViaAlias<TSrc> {
  return 'via' in spec;
}

/**
 * @internal
 */
function isValueSpecWithDeps<TCtx extends ContextValues, TSrc, TDeps extends any[]>(
    spec: ContextValueSpec.ByProvider<TCtx, TSrc> | ContextValueSpec.ByProviderWithDeps<TSrc, TDeps>,
): spec is ContextValueSpec.ByProviderWithDeps<TSrc, TDeps>;

/**
 * @internal
 */
function isValueSpecWithDeps<TCtx extends ContextValues, TSrc, TDeps extends any[]>(
    spec: ContextValueSpec.AsInstance<TCtx, TSrc> | ContextValueSpec.AsInstanceWithDeps<TSrc, TDeps>,
): spec is ContextValueSpec.AsInstanceWithDeps<TSrc, TDeps>;

/**
 * @internal
 */
function isValueSpecWithDeps<TCtx extends ContextValues, TSrc, TDeps extends any[]>(
    spec: ContextValueSpec<TCtx, unknown, TSrc, TDeps>,
): boolean {
  return 'with' in spec;
}
