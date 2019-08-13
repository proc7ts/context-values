/**
 * @module context-values
 */
import { ContextRequest, ContextSources, ContextTarget } from './context-value';
import { ContextValues } from './context-values';

/**
 * Context value provider.
 *
 * It is responsible for constructing the values associated with particular key for the given context. Note that
 * provider generates source value, not the context values themselves.
 *
 * @typeparam C  Context type.
 * @typeparam S  Source value type.
 */

export type ContextValueProvider<C extends ContextValues, S> =
/**
 * @param context  Target context.
 *
 * @return Either constructed value, or `null`/`undefined` if the value can not be constructed.
 */
    (this: void, context: C) => S | null | undefined;

/**
 * A provider of context value sources.
 *
 * @typeparam C  Context type.
 */
export type ContextSourcesProvider<C extends ContextValues> =
/**
 * @typeparam S  Source value type.
 *
 * @param target  Context value definition target.
 * @param context  Target context.
 *
 * @returns Context value sources associated with the given key provided for the given context.
 */
    <S>(this: void, target: ContextTarget<S>, context: C) => ContextSources<S>;

/**
 * Context value specifier.
 *
 * @typeparam C  Context type.
 * @typeparam V  Context value type.
 * @typeparam D  Dependencies tuple type.
 * @typeparam S  Source value type.
 */
export type ContextValueSpec<C extends ContextValues, V, D extends any[] = unknown[], S = V> =
    ContextValueSpec.IsConstant<S>
    | ContextValueSpec.ViaAlias<S>
    | ContextValueSpec.ByProvider<C, S>
    | ContextValueSpec.ByProviderWithDeps<D, S>
    | ContextValueSpec.AsInstance<C, S>
    | ContextValueSpec.SelfInstance<C, S>
    | ContextValueSpec.AsInstanceWithDeps<D, S>
    | ContextValueSpec.SelfInstanceWithDeps<D, S>;

export namespace ContextValueSpec {

  /**
   * A specifier defining a context value is constant.
   *
   * @typeparam S  Source value type.
   */
  export interface IsConstant<S> {

    /**
     * Target value to define.
     */
    a: ContextTarget<S>;

    /**
     * Constant context value.
     */
    is: S;

  }

  /**
   * A specifier defining a context value via another one (alias).
   *
   * @typeparam S  Source value type.
   */
  export interface ViaAlias<S> {

    /**
     * Target value to define.
     */
    a: ContextTarget<S>;

    /**
     * Context value request for the another value that will be used instead as provided one.
     */
    via: ContextRequest<S>;

  }

  /**
   * A specifier of context value defined by provider function.
   *
   * @typeparam C  Context type.
   * @typeparam S  Source value type.
   */
  export interface ByProvider<C extends ContextValues, S> {

    /**
     * Target value to define.
     */
    a: ContextTarget<S>;

    /**
     * Context value provider.
     */
    by: ContextValueProvider<C, S>;

  }

  /**
   * A specifier of context value defined by provider function depending on other context values.
   *
   * @typeparam D  Dependencies tuple type.
   * @typeparam S  Source value type.
   */
  export interface ByProviderWithDeps<D extends any[], S> {

    /**
     * Target value to define.
     */
    a: ContextTarget<S>;

    /**
     * Context value provider function.
     */
    by: (this: void, ...args: D) => S | null | undefined;

    /**
     * Context value requests for corresponding value provider function arguments.
     */
    with: DepsRequests<D>;

  }

  /**
   * A specifier of context value defined as instance of some class.
   *
   * @typeparam C  Context type.
   * @typeparam S  Source value type.
   */
  export interface AsInstance<C extends ContextValues, S> {

    /**
     * Target value to define.
     */
    a: ContextTarget<S>;

    /**
     * Context value class constructor.
     */
    as: new (context: C) => S;

  }

  /**
   * A specifier of context value defined as instance of the same class as value.
   *
   * @typeparam C  Context type.
   * @typeparam S  Source value type.
   */
  export interface SelfInstance<C extends ContextValues, S> {

    /**
     * Target value to define as its class constructor.
     */
    as: ContextTarget<S> & (new (context: C) => S);

  }

  /**
   * A specifier of context value defined as instance of some class with constructor depending on other context values.
   *
   * @typeparam D  Dependencies tuple type.
   * @typeparam S  Source value type.
   */
  export interface AsInstanceWithDeps<D extends any[], S> {

    /**
     * Target value to define.
     */
    a: ContextTarget<S>;

    /**
     * Context value class constructor.
     */
    as: new (...args: D) => S;

    /**
     * Context value requests for corresponding constructor arguments.
     */
    with: DepsRequests<D>;

  }

  /**
   * A specifier of context value defined as instance of the same class as value with constructor depending on other
   * context values.
   *
   * @typeparam D  Dependencies tuple type.
   * @typeparam S  Source value type.
   */
  export interface SelfInstanceWithDeps<D extends any[], S> {

    /**
     * Target value to define as its class constructor.
     */
    as: ContextTarget<S> & (new (...args: D) => S);

    /**
     * Context value requests for corresponding constructor arguments.
     */
    with: DepsRequests<D>;

  }

  /**
   * Dependencies requests.
   *
   * This is a tuple of context value requests, each of which corresponds to dependency.
   *
   * @typeparam D  Dependencies tuple type.
   */
  export type DepsRequests<D extends any[]> = {
    [K in keyof D]: ContextRequest<D[K]>;
  };

}

/**
 * Constructs a specifier of context value defined by provider out of arbitrary one.
 *
 * @typeparam C  Context type.
 * @typeparam V  Context value type.
 * @typeparam D  Dependencies tuple type.
 * @typeparam S  Source value type.
 * @param spec  Context value specifier to convert.
 *
 * @returns A specifier of context value defined by provider function.
 *
 * @throws TypeError  On malformed context value specifier.
 */
export function contextValueSpec<C extends ContextValues, V, D extends any[], S = V>(
    spec: ContextValueSpec<C, V, D, S>,
): ContextValueSpec.ByProvider<C, S> {
  if (byProvider(spec)) {
    if (!withDeps<C, D, S>(spec)) {
      return spec;
    }

    const { a, by, with: deps } = spec;

    return {
      a,
      by(this: void, context: C) {
        function dep<T>(request: ContextRequest<T>): T {
          return context.get(request);
        }

        return by(...deps.map(dep) as D);
      },
    };
  }
  if (isConstant<S>(spec)) {

    const { a, is: value } = spec;

    return {
      a,
      by: () => value,
    };
  }
  if (viaAlias(spec)) {

    const { a, via } = spec;

    return {
      a,
      by: (ctx: C) => ctx.get(via),
    };
  }
  if (asInstance<C, D, S>(spec)) {
    if (selfInstance<C, D, S>(spec)) {
      spec = toAsInstance(spec);
    }
    if (!withDeps<C, D, S>(spec)) {

      const { a, as: type } = spec;

      return {
        a,
        by: (ctx: C) => new type(ctx),
      };
    } else {

      const { a, as: type, with: deps } = spec;

      return {
        a,
        by(this: void, context: C) {
          function dep<T>(request: ContextRequest<T>): T {
            return context.get(request);
          }

          return new type(...deps.map(dep) as D);
        },
      };
    }
  }

  throw new TypeError(`Malformed context value specifier: ${spec}`);
}

function byProvider<C extends ContextValues, D extends any[], S>(
    spec: ContextValueSpec<C, any, D, S>):
    spec is ContextValueSpec.ByProvider<C, S> | ContextValueSpec.ByProviderWithDeps<D, S> {
  return 'by' in spec;
}

function asInstance<C extends ContextValues, D extends any[], S>(
    spec: ContextValueSpec<C, any, D, S>):
    spec is ContextValueSpec.AsInstance<C, S> | ContextValueSpec.AsInstanceWithDeps<D, S> {
  return 'as' in spec;
}

function selfInstance<C extends ContextValues, D extends any[], S>(
    spec: ContextValueSpec<C, any, D, S>):
    spec is ContextValueSpec.SelfInstance<C, S> | ContextValueSpec.SelfInstanceWithDeps<D, S> {
  return !('a' in spec);
}

function toAsInstance<C extends ContextValues, D extends any[], S>(
    spec: ContextValueSpec.SelfInstance<C, S> | ContextValueSpec.SelfInstanceWithDeps<D, S>):
    ContextValueSpec.AsInstance<C, S> | ContextValueSpec.AsInstanceWithDeps<D, S> {
  return {
    ...spec,
    a: spec.as,
  } as ContextValueSpec.AsInstance<C, S> | ContextValueSpec.AsInstanceWithDeps<D, S>;
}

function isConstant<S>(spec: ContextValueSpec<any, any, any, S>): spec is ContextValueSpec.IsConstant<S> {
  return 'is' in spec;
}

function viaAlias<S>(spec: ContextValueSpec<any, any, any, S>): spec is ContextValueSpec.ViaAlias<S> {
  return 'via' in spec;
}
function withDeps<C extends ContextValues, D extends any[], S>(
    spec: ContextValueSpec.ByProvider<C, S> | ContextValueSpec.ByProviderWithDeps<D, S>):
    spec is ContextValueSpec.ByProviderWithDeps<D, S>;
function withDeps<C extends ContextValues, D extends any[], S>(
    spec: ContextValueSpec.AsInstance<C, S> | ContextValueSpec.AsInstanceWithDeps<D, S>):
    spec is ContextValueSpec.AsInstanceWithDeps<D, S>;

function withDeps<C extends ContextValues, D extends any[], S>(spec: ContextValueSpec<C, any, D, S>): boolean {
  return 'with' in spec;
}
