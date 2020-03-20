/**
 * @packageDocumentation
 * @module @proc7ts/context-values
 */
import { valueProvider } from '@proc7ts/call-thru';
import { ContextRequest, ContextTarget } from './context-ref';
import { ContextValues } from './context-values';

/**
 * Context value provider.
 *
 * It is responsible for constructing the values associated with particular key for the given context. Note that
 * provider generates source value, not the context values themselves.
 *
 * @typeparam Ctx  Context type.
 * @typeparam Src  Source value type.
 */
export type ContextValueProvider<Ctx extends ContextValues, Src> =
/**
 * @param context  Target context.
 *
 * @return Either constructed value source, or `null`/`undefined` if unknown.
 */
    (this: void, context: Ctx) => Src | null | undefined;

/**
 * Context value specifier.
 *
 * @typeparam Ctx  Context type.
 * @typeparam Value  Context value type.
 * @typeparam Deps  Dependencies tuple type.
 * @typeparam Src  Source value type.
 * @typeparam Seed  Value seed type.
 */
export type ContextValueSpec<
    Ctx extends ContextValues,
    Value,
    Deps extends any[] = unknown[],
    Src = Value,
    Seed = unknown> =
    | ContextValueSpec.IsConstant<Src, Seed>
    | ContextValueSpec.ViaAlias<Src, Seed>
    | ContextValueSpec.ByProvider<Ctx, Src, Seed>
    | ContextValueSpec.ByProviderWithDeps<Deps, Src, Seed>
    | ContextValueSpec.AsInstance<Ctx, Src, Seed>
    | ContextValueSpec.SelfInstance<Ctx, Src, Seed>
    | ContextValueSpec.AsInstanceWithDeps<Deps, Src, Seed>
    | ContextValueSpec.SelfInstanceWithDeps<Deps, Src, Seed>;

export namespace ContextValueSpec {

  /**
   * A specifier defining a context value is constant.
   *
   * @typeparam Src  Source value type.
   * @typeparam Seed  Value seed type.
   */
  export interface IsConstant<Src, Seed = unknown> {

    /**
     * Target value to define.
     */
    a: ContextTarget<Src, Seed>;

    /**
     * Constant context value.
     */
    is: Src;

  }

  /**
   * A specifier defining a context value via another one (alias).
   *
   * @typeparam Sec  Source value type.
   * @typeparam Seed  Value seed type.
   */
  export interface ViaAlias<Src, Seed = unknown> {

    /**
     * Target value to define.
     */
    a: ContextTarget<Src, Seed>;

    /**
     * Context value request for the another value that will be used instead as provided one.
     */
    via: ContextRequest<Src, Seed>;

  }

  /**
   * A specifier of context value defined by provider function.
   *
   * @typeparam Ctx  Context type.
   * @typeparam Src  Source value type.
   * @typeparam Seed  Value seed type.
   */
  export interface ByProvider<Ctx extends ContextValues, Src, Seed = unknown> {

    /**
     * Target value to define.
     */
    a: ContextTarget<Src, Seed>;

    /**
     * Context value provider.
     */
    by: ContextValueProvider<Ctx, Src>;

  }

  /**
   * A specifier of context value defined by provider function depending on other context values.
   *
   * @typeparam Deps  Dependencies tuple type.
   * @typeparam Src  Source value type.
   * @typeparam Seed  Value seed type.
   */
  export interface ByProviderWithDeps<Deps extends any[], Src, Seed = unknown> {

    /**
     * Target value to define.
     */
    a: ContextTarget<Src, Seed>;

    /**
     * Context value provider function.
     */
    by: (this: void, ...args: Deps) => Src | null | undefined;

    /**
     * Context value requests for corresponding value provider function arguments.
     */
    with: DepsRequests<Deps>;

  }

  /**
   * A specifier of context value defined as instance of some class.
   *
   * @typeparam Ctx  Context type.
   * @typeparam Src  Source value type.
   * @typeparam Seed  Value seed type.
   */
  export interface AsInstance<Ctx extends ContextValues, Src, Seed = unknown> {

    /**
     * Target value to define.
     */
    a: ContextTarget<Src, Seed>;

    /**
     * Context value class constructor.
     */
    as: new (context: Ctx) => Src;

  }

  /**
   * A specifier of context value defined as instance of the same class as value.
   *
   * @typeparam Ctx  Context type.
   * @typeparam Src  Source value type.
   * @typeparam Seed  Value seed type.
   */
  export interface SelfInstance<Ctx extends ContextValues, Src, Seed = unknown> {

    /**
     * Target value to define as its class constructor.
     */
    as: ContextTarget<Src, Seed> & (new (context: Ctx) => Src);

  }

  /**
   * A specifier of context value defined as instance of some class with constructor depending on other context values.
   *
   * @typeparam Deps  Dependencies tuple type.
   * @typeparam Src  Source value type.
   * @typeparam Seed  Value seed type.
   */
  export interface AsInstanceWithDeps<Deps extends any[], Src, Seed = unknown> {

    /**
     * Target value to define.
     */
    a: ContextTarget<Src, Seed>;

    /**
     * Context value class constructor.
     */
    as: new (...args: Deps) => Src;

    /**
     * Context value requests for corresponding constructor arguments.
     */
    with: DepsRequests<Deps>;

  }

  /**
   * A specifier of context value defined as instance of the same class as value with constructor depending on other
   * context values.
   *
   * @typeparam Deps  Dependencies tuple type.
   * @typeparam Src  Source value type.
   * @typeparam Seed  Value seed type.
   */
  export interface SelfInstanceWithDeps<Deps extends any[], Src, Seed = unknown> {

    /**
     * Target value to define as its class constructor.
     */
    as: ContextTarget<Src, Seed> & (new (...args: Deps) => Src);

    /**
     * Context value requests for corresponding constructor arguments.
     */
    with: DepsRequests<Deps>;

  }

  /**
   * Dependencies requests.
   *
   * This is a tuple of context value requests, each of which corresponds to dependency.
   *
   * @typeparam Deps  Dependencies tuple type.
   */
  export type DepsRequests<Deps extends any[]> = {
    [K in keyof Deps]: ContextRequest<Deps[K]>;
  };

}

/**
 * Constructs a specifier of context value defined by provider out of arbitrary one.
 *
 * @typeparam Ctx  Context type.
 * @typeparam Value  Context value type.
 * @typeparam Deps  Dependencies tuple type.
 * @typeparam Src  Source value type.
 * @param spec  Context value specifier to convert.
 *
 * @returns A specifier of context value defined by provider function.
 *
 * @throws TypeError  On malformed context value specifier.
 */
export function contextValueSpec<Ctx extends ContextValues, Value, Deps extends any[], Src, Seed>(
    spec: ContextValueSpec<Ctx, Value, Deps, Src, Seed>,
): ContextValueSpec.ByProvider<Ctx, Src, Seed> {
  if (byProvider(spec)) {
    if (!withDeps<Ctx, Deps, Src, Seed>(spec)) {
      return spec;
    }

    const { a, by, with: deps } = spec;

    return {
      a,
      by(this: void, context: Ctx) {
        return by(...deps.map(dep => context.get(dep)) as Deps);
      },
    };
  }
  if (isConstant<Src, Seed>(spec)) {

    const { a, is: value } = spec;

    return {
      a,
      by: valueProvider(value),
    };
  }
  if (viaAlias(spec)) {

    const { a, via } = spec;

    return {
      a,
      by(ctx: Ctx) {
        return ctx.get(via);
      },
    };
  }
  if (asInstance<Ctx, Deps, Src, Seed>(spec)) {
    if (selfInstance<Ctx, Deps, Src, Seed>(spec)) {
      spec = toAsInstance(spec);
    }
    if (!withDeps<Ctx, Deps, Src, Seed>(spec)) {

      const { as: Type } = spec;

      return {
        a: spec.a,
        by(ctx: Ctx) {
          return new Type(ctx);
        },
      };
    }

    const { as: DepType, with: deps } = spec;

    return {
      a: spec.a,
      by(this: void, context: Ctx) {
        return new DepType(...deps.map(dep => context.get(dep)) as Deps);
      },
    };
  }

  throw new TypeError(`Malformed context value specifier: ${spec}`);
}

/**
 * @internal
 */
function byProvider<Ctx extends ContextValues, Deps extends any[], Src, Seed>(
    spec: ContextValueSpec<Ctx, any, Deps, Src, Seed>,
): spec is ContextValueSpec.ByProvider<Ctx, Src, Seed> | ContextValueSpec.ByProviderWithDeps<Deps, Src, Seed> {
  return 'by' in spec;
}

/**
 * @internal
 */
function asInstance<Ctx extends ContextValues, Deps extends any[], Src, Seed>(
    spec: ContextValueSpec<Ctx, any, Deps, Src, Seed>,
): spec is ContextValueSpec.AsInstance<Ctx, Src, Seed> | ContextValueSpec.AsInstanceWithDeps<Deps, Src, Seed> {
  return 'as' in spec;
}

/**
 * @internal
 */
function selfInstance<Ctx extends ContextValues, Deps extends any[], Src, Seed>(
    spec: ContextValueSpec<Ctx, any, Deps, Src, Seed>,
): spec is ContextValueSpec.SelfInstance<Ctx, Src, Seed> | ContextValueSpec.SelfInstanceWithDeps<Deps, Src, Seed> {
  return !('a' in spec);
}

/**
 * @internal
 */
function toAsInstance<Ctx extends ContextValues, Deps extends any[], Src, Seed>(
    spec: ContextValueSpec.SelfInstance<Ctx, Src, Seed> | ContextValueSpec.SelfInstanceWithDeps<Deps, Src, Seed>,
): ContextValueSpec.AsInstance<Ctx, Src, Seed> | ContextValueSpec.AsInstanceWithDeps<Deps, Src, Seed> {
  return {
    ...spec,
    a: spec.as,
  } as ContextValueSpec.AsInstance<Ctx, Src, Seed> | ContextValueSpec.AsInstanceWithDeps<Deps, Src, Seed>;
}

/**
 * @internal
 */
function isConstant<Src, Seed>(
    spec: ContextValueSpec<any, any, any, Src, Seed>,
): spec is ContextValueSpec.IsConstant<Src, Seed> {
  return 'is' in spec;
}

/**
 * @internal
 */
function viaAlias<Src, Seed>(
    spec: ContextValueSpec<any, any, any, Src, Seed>,
): spec is ContextValueSpec.ViaAlias<Src, Seed> {
  return 'via' in spec;
}

/**
 * @internal
 */
function withDeps<Ctx extends ContextValues, Deps extends any[], Src, Seed>(
    spec: ContextValueSpec.ByProvider<Ctx, Src, Seed> | ContextValueSpec.ByProviderWithDeps<Deps, Src, Seed>,
): spec is ContextValueSpec.ByProviderWithDeps<Deps, Src, Seed>;

/**
 * @internal
 */
function withDeps<Ctx extends ContextValues, Deps extends any[], Src, Seed>(
    spec: ContextValueSpec.AsInstance<Ctx, Src, Seed> | ContextValueSpec.AsInstanceWithDeps<Deps, Src, Seed>,
): spec is ContextValueSpec.AsInstanceWithDeps<Deps, Src, Seed>;

/**
 * @internal
 */
function withDeps<Ctx extends ContextValues, Deps extends any[], Src, Seed>(
    spec: ContextValueSpec<Ctx, any, Deps, Src, Seed>,
): boolean {
  return 'with' in spec;
}
