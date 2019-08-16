/**
 * @module context-values
 */
import { valueProvider } from 'call-thru';
import { ContextRequest } from './context-request';
import { ContextKey } from './context-key';
import { ContextValues } from './context-values';

/**
 * Context value definition target.
 *
 * Designates a declared declaring context value.
 *
 * @typeparam Src  A type of declared context value sources.
 */
export interface ContextTarget<Src> extends ContextRequest<any> {

  /**
   * A key of context value to provide.
   */
  readonly key: ContextKey<any, Src>;

}

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
 * @return Either constructed value, or `null`/`undefined` if the value can not be constructed.
 */
    (this: void, context: Ctx) => Src | null | undefined;

/**
 * Context value specifier.
 *
 * @typeparam Ctx  Context type.
 * @typeparam Value  Context value type.
 * @typeparam Deps  Dependencies tuple type.
 * @typeparam Src  Source value type.
 */
export type ContextValueSpec<Ctx extends ContextValues, Value, Deps extends any[] = unknown[], Src = Value> =
    | ContextValueSpec.IsConstant<Src>
    | ContextValueSpec.ViaAlias<Src>
    | ContextValueSpec.ByProvider<Ctx, Src>
    | ContextValueSpec.ByProviderWithDeps<Deps, Src>
    | ContextValueSpec.AsInstance<Ctx, Src>
    | ContextValueSpec.SelfInstance<Ctx, Src>
    | ContextValueSpec.AsInstanceWithDeps<Deps, Src>
    | ContextValueSpec.SelfInstanceWithDeps<Deps, Src>;

export namespace ContextValueSpec {

  /**
   * A specifier defining a context value is constant.
   *
   * @typeparam Src  Source value type.
   */
  export interface IsConstant<Src> {

    /**
     * Target value to define.
     */
    a: ContextTarget<Src>;

    /**
     * Constant context value.
     */
    is: Src;

  }

  /**
   * A specifier defining a context value via another one (alias).
   *
   * @typeparam Sec  Source value type.
   */
  export interface ViaAlias<Src> {

    /**
     * Target value to define.
     */
    a: ContextTarget<Src>;

    /**
     * Context value request for the another value that will be used instead as provided one.
     */
    via: ContextRequest<Src>;

  }

  /**
   * A specifier of context value defined by provider function.
   *
   * @typeparam Ctx  Context type.
   * @typeparam Src  Source value type.
   */
  export interface ByProvider<Ctx extends ContextValues, Src> {

    /**
     * Target value to define.
     */
    a: ContextTarget<Src>;

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
   */
  export interface ByProviderWithDeps<Deps extends any[], Src> {

    /**
     * Target value to define.
     */
    a: ContextTarget<Src>;

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
   */
  export interface AsInstance<Ctx extends ContextValues, Src> {

    /**
     * Target value to define.
     */
    a: ContextTarget<Src>;

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
   */
  export interface SelfInstance<Ctx extends ContextValues, Src> {

    /**
     * Target value to define as its class constructor.
     */
    as: ContextTarget<Src> & (new (context: Ctx) => Src);

  }

  /**
   * A specifier of context value defined as instance of some class with constructor depending on other context values.
   *
   * @typeparam Deps  Dependencies tuple type.
   * @typeparam Src  Source value type.
   */
  export interface AsInstanceWithDeps<Deps extends any[], Src> {

    /**
     * Target value to define.
     */
    a: ContextTarget<Src>;

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
   */
  export interface SelfInstanceWithDeps<Deps extends any[], Src> {

    /**
     * Target value to define as its class constructor.
     */
    as: ContextTarget<Src> & (new (...args: Deps) => Src);

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
export function contextValueSpec<Ctx extends ContextValues, Value, Deps extends any[], Src = Value>(
    spec: ContextValueSpec<Ctx, Value, Deps, Src>,
): ContextValueSpec.ByProvider<Ctx, Src> {
  if (byProvider(spec)) {
    if (!withDeps<Ctx, Deps, Src>(spec)) {
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
  if (isConstant<Src>(spec)) {

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
  if (asInstance<Ctx, Deps, Src>(spec)) {
    if (selfInstance<Ctx, Deps, Src>(spec)) {
      spec = toAsInstance(spec);
    }
    if (!withDeps<Ctx, Deps, Src>(spec)) {

      const { a, as: type } = spec;

      return {
        a,
        by(ctx: Ctx) {
          return new type(ctx);
        },
      };
    } else {

      const { a, as: type, with: deps } = spec;

      return {
        a,
        by(this: void, context: Ctx) {
          return new type(...deps.map(dep => context.get(dep)) as Deps);
        },
      };
    }
  }

  throw new TypeError(`Malformed context value specifier: ${spec}`);
}

function byProvider<Ctx extends ContextValues, Deps extends any[], Src>(
    spec: ContextValueSpec<Ctx, any, Deps, Src>,
): spec is ContextValueSpec.ByProvider<Ctx, Src> | ContextValueSpec.ByProviderWithDeps<Deps, Src> {
  return 'by' in spec;
}

function asInstance<Ctx extends ContextValues, Deps extends any[], Src>(
    spec: ContextValueSpec<Ctx, any, Deps, Src>,
): spec is ContextValueSpec.AsInstance<Ctx, Src> | ContextValueSpec.AsInstanceWithDeps<Deps, Src> {
  return 'as' in spec;
}

function selfInstance<Ctx extends ContextValues, Deps extends any[], Src>(
    spec: ContextValueSpec<Ctx, any, Deps, Src>,
): spec is ContextValueSpec.SelfInstance<Ctx, Src> | ContextValueSpec.SelfInstanceWithDeps<Deps, Src> {
  return !('a' in spec);
}

function toAsInstance<Ctx extends ContextValues, Deps extends any[], Src>(
    spec: ContextValueSpec.SelfInstance<Ctx, Src> | ContextValueSpec.SelfInstanceWithDeps<Deps, Src>,
): ContextValueSpec.AsInstance<Ctx, Src> | ContextValueSpec.AsInstanceWithDeps<Deps, Src> {
  return {
    ...spec,
    a: spec.as,
  } as ContextValueSpec.AsInstance<Ctx, Src> | ContextValueSpec.AsInstanceWithDeps<Deps, Src>;
}

function isConstant<Src>(spec: ContextValueSpec<any, any, any, Src>): spec is ContextValueSpec.IsConstant<Src> {
  return 'is' in spec;
}

function viaAlias<Src>(spec: ContextValueSpec<any, any, any, Src>): spec is ContextValueSpec.ViaAlias<Src> {
  return 'via' in spec;
}
function withDeps<Ctx extends ContextValues, Deps extends any[], Src>(
    spec: ContextValueSpec.ByProvider<Ctx, Src> | ContextValueSpec.ByProviderWithDeps<Deps, Src>,
): spec is ContextValueSpec.ByProviderWithDeps<Deps, Src>;

function withDeps<Ctx extends ContextValues, Deps extends any[], Src>(
    spec: ContextValueSpec.AsInstance<Ctx, Src> | ContextValueSpec.AsInstanceWithDeps<Deps, Src>,
): spec is ContextValueSpec.AsInstanceWithDeps<Deps, Src>;

function withDeps<Ctx extends ContextValues, Deps extends any[], Src>(
    spec: ContextValueSpec<Ctx, any, Deps, Src>,
): boolean {
  return 'with' in spec;
}
