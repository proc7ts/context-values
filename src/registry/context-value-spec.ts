import { valueProvider } from '@proc7ts/primitives';
import type { ContextRequest } from '../context-request';
import type { ContextValues } from '../context-values';
import type { ContextBuilder } from './context-builder';
import type { ContextTarget } from './context-target';

/**
 * Context value provider.
 *
 * It is responsible for constructing the values associated with particular key for the given context. Note that
 * provider generates source value, not the context values themselves.
 *
 * @typeParam TCtx - Context type.
 * @typeParam TSrc - Source value type.
 */
export type ContextValueProvider<TCtx extends ContextValues, TSrc> =
/**
 * @param context - Target context.
 *
 * @return Either constructed value source, or `null`/`undefined` if unknown.
 */
    (this: void, context: TCtx) => TSrc | null | undefined;

/**
 * Context value specifier.
 *
 * Either explicit one, or a {@link ContextBuilder context builder}.
 *
 * @typeParam TCtx - Context type.
 * @typeParam TValue - Context value type.
 * @typeParam TDeps - Dependencies tuple type.
 * @typeParam TSrc - Source value type.
 * @typeParam TSeed - Value seed type.
 */
export type ContextValueSpec<
    TCtx extends ContextValues,
    TValue,
    TDeps extends any[] = unknown[],
    TSrc = TValue,
    TSeed = unknown> =
    | ContextValueSpec.Explicit<TCtx, TValue, TDeps, TSrc, TSeed>
    | ContextBuilder<TCtx>;

export namespace ContextValueSpec {

  /**
   * Explicit context value specifier.
   *
   * @typeParam TCtx - Context type.
   * @typeParam TValue - Context value type.
   * @typeParam TDeps - Dependencies tuple type.
   * @typeParam TSrc - Source value type.
   * @typeParam TSeed - Value seed type.
   */
  export type Explicit<
      TCtx extends ContextValues,
      TValue,
      TDeps extends any[] = unknown[],
      TSrc = TValue,
      TSeed = unknown> =
      | ContextValueSpec.IsConstant<TSrc, TSeed>
      | ContextValueSpec.ViaAlias<TSrc, TSeed>
      | ContextValueSpec.ByProvider<TCtx, TSrc, TSeed>
      | ContextValueSpec.ByProviderWithDeps<TDeps, TSrc, TSeed>
      | ContextValueSpec.AsInstance<TCtx, TSrc, TSeed>
      | ContextValueSpec.SelfInstance<TCtx, TSrc, TSeed>
      | ContextValueSpec.AsInstanceWithDeps<TDeps, TSrc, TSeed>
      | ContextValueSpec.SelfInstanceWithDeps<TDeps, TSrc, TSeed>;

  /**
   * A specifier defining a context value is constant.
   *
   * @typeParam TSrc - Source value type.
   * @typeParam TSeed - Value seed type.
   */
  export interface IsConstant<TSrc, TSeed = unknown> {

    /**
     * Target value to define.
     */
    a: ContextTarget<TSrc, TSeed>;

    /**
     * Constant context value.
     */
    is: TSrc;

  }

  /**
   * A specifier defining a context value via another one (alias).
   *
   * @typeParam TSrc - Source value type.
   * @typeParam TSeed - Value seed type.
   */
  export interface ViaAlias<TSrc, TSeed = unknown> {

    /**
     * Target value to define.
     */
    a: ContextTarget<TSrc, TSeed>;

    /**
     * Context value request for the another value that will be used instead as provided one.
     */
    via: ContextRequest<TSrc, TSeed>;

  }

  /**
   * A specifier of context value defined by provider function.
   *
   * @typeParam TCtx - Context type.
   * @typeParam TSrc - Source value type.
   * @typeParam TSeed - Value seed type.
   */
  export interface ByProvider<TCtx extends ContextValues, TSrc, TSeed = unknown> {

    /**
     * Target value to define.
     */
    a: ContextTarget<TSrc, TSeed>;

    /**
     * Context value provider.
     */
    by: ContextValueProvider<TCtx, TSrc>;

  }

  /**
   * A specifier of context value defined by provider function depending on other context values.
   *
   * @typeParam TDeps - Dependencies tuple type.
   * @typeParam TSrc - Source value type.
   * @typeParam TSeed - Value seed type.
   */
  export interface ByProviderWithDeps<TDeps extends any[], TSrc, TSeed = unknown> {

    /**
     * Target value to define.
     */
    a: ContextTarget<TSrc, TSeed>;

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
   * @typeParam TSeed - Value seed type.
   */
  export interface AsInstance<TCtx extends ContextValues, TSrc, TSeed = unknown> {

    /**
     * Target value to define.
     */
    a: ContextTarget<TSrc, TSeed>;

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
   * @typeParam TSeed - Value seed type.
   */
  export interface SelfInstance<TCtx extends ContextValues, TSrc, TSeed = unknown> {

    /**
     * Target value to define as its class constructor.
     */
    as: ContextTarget<TSrc, TSeed> & (new (context: TCtx) => TSrc);

  }

  /**
   * A specifier of context value defined as instance of some class with constructor depending on other context values.
   *
   * @typeParam TDeps - Dependencies tuple type.
   * @typeParam TSrc - Source value type.
   * @typeParam TSeed - Value seed type.
   */
  export interface AsInstanceWithDeps<TDeps extends any[], TSrc, TSeed = unknown> {

    /**
     * Target value to define.
     */
    a: ContextTarget<TSrc, TSeed>;

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
   * @typeParam TDeps - Dependencies tuple type.
   * @typeParam TSrc - Source value type.
   * @typeParam TSeed - Value seed type.
   */
  export interface SelfInstanceWithDeps<TDeps extends any[], TSrc, TSeed = unknown> {

    /**
     * Target value to define as its class constructor.
     */
    as: ContextTarget<TSrc, TSeed> & (new (...args: TDeps) => TSrc);

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
 * @typeParam TDeps - Dependencies tuple type.
 * @typeParam TSrc - Source value type.
 * @param spec - Explicit context value specifier to convert.
 *
 * @returns A specifier of context value defined by provider function.
 *
 * @throws TypeError  On malformed context value specifier.
 */
export function contextValueSpec<TCtx extends ContextValues, TValue, TDeps extends any[], TSrc, TSeed>(
    spec: ContextValueSpec.Explicit<TCtx, TValue, TDeps, TSrc, TSeed>,
): ContextValueSpec.ByProvider<TCtx, TSrc, TSeed> {
  if (isValueSpecByProvider(spec)) {
    if (!isValueSpecWithDeps<TCtx, TDeps, TSrc, TSeed>(spec)) {
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
  if (isConstantValueSpec<TSrc, TSeed>(spec)) {

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
  if (isValueSpecAsInstance<TCtx, TDeps, TSrc, TSeed>(spec)) {
    if (isSelfInstanceValueSpec<TCtx, TDeps, TSrc, TSeed>(spec)) {
      spec = toAsInstance(spec);
    }
    if (!isValueSpecWithDeps<TCtx, TDeps, TSrc, TSeed>(spec)) {

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
function isValueSpecByProvider<TCtx extends ContextValues, TDeps extends any[], TSrc, TSeed>(
    spec: ContextValueSpec<TCtx, unknown, TDeps, TSrc, TSeed>,
): spec is
    | ContextValueSpec.ByProvider<TCtx, TSrc, TSeed>
    | ContextValueSpec.ByProviderWithDeps<TDeps, TSrc, TSeed> {
  return 'by' in spec;
}

/**
 * @internal
 */
function isValueSpecAsInstance<TCtx extends ContextValues, TDeps extends any[], TSrc, TSeed>(
    spec: ContextValueSpec<TCtx, unknown, TDeps, TSrc, TSeed>,
): spec is
    | ContextValueSpec.AsInstance<TCtx, TSrc, TSeed>
    | ContextValueSpec.AsInstanceWithDeps<TDeps, TSrc, TSeed> {
  return 'as' in spec;
}

/**
 * @internal
 */
function isSelfInstanceValueSpec<TCtx extends ContextValues, TDeps extends any[], TSrc, TSeed>(
    spec: ContextValueSpec<TCtx, unknown, TDeps, TSrc, TSeed>,
): spec is
    | ContextValueSpec.SelfInstance<TCtx, TSrc, TSeed>
    | ContextValueSpec.SelfInstanceWithDeps<TDeps, TSrc, TSeed> {
  return !('a' in spec);
}

/**
 * @internal
 */
function toAsInstance<TCtx extends ContextValues, TDeps extends any[], TSrc, TSeed>(
    spec: ContextValueSpec.SelfInstance<TCtx, TSrc, TSeed> | ContextValueSpec.SelfInstanceWithDeps<TDeps, TSrc, TSeed>,
): ContextValueSpec.AsInstance<TCtx, TSrc, TSeed> | ContextValueSpec.AsInstanceWithDeps<TDeps, TSrc, TSeed> {
  return {
    ...spec,
    a: spec.as,
  } as ContextValueSpec.AsInstance<TCtx, TSrc, TSeed> | ContextValueSpec.AsInstanceWithDeps<TDeps, TSrc, TSeed>;
}

/**
 * @internal
 */
function isConstantValueSpec<TSrc, TSeed>(
    spec: ContextValueSpec<any, unknown, any, TSrc, TSeed>,
): spec is ContextValueSpec.IsConstant<TSrc, TSeed> {
  return 'is' in spec;
}

/**
 * @internal
 */
function isValueSpecViaAlias<TSrc, TSeed>(
    spec: ContextValueSpec<any, unknown, any, TSrc, TSeed>,
): spec is ContextValueSpec.ViaAlias<TSrc, TSeed> {
  return 'via' in spec;
}

/**
 * @internal
 */
function isValueSpecWithDeps<TCtx extends ContextValues, TDeps extends any[], TSrc, TSeed>(
    spec: ContextValueSpec.ByProvider<TCtx, TSrc, TSeed> | ContextValueSpec.ByProviderWithDeps<TDeps, TSrc, TSeed>,
): spec is ContextValueSpec.ByProviderWithDeps<TDeps, TSrc, TSeed>;

/**
 * @internal
 */
function isValueSpecWithDeps<TCtx extends ContextValues, TDeps extends any[], TSrc, TSeed>(
    spec: ContextValueSpec.AsInstance<TCtx, TSrc, TSeed> | ContextValueSpec.AsInstanceWithDeps<TDeps, TSrc, TSeed>,
): spec is ContextValueSpec.AsInstanceWithDeps<TDeps, TSrc, TSeed>;

/**
 * @internal
 */
function isValueSpecWithDeps<TCtx extends ContextValues, TDeps extends any[], TSrc, TSeed>(
    spec: ContextValueSpec<TCtx, unknown, TDeps, TSrc, TSeed>,
): boolean {
  return 'with' in spec;
}
