/**
 * @packageDocumentation
 * @module @proc7ts/context-values
 */
import { ContextKey, ContextKey__symbol } from './context-key';

/**
 * A request for context value.
 *
 * This is passed to [[ContextValues.get]] methods in order to obtain a context value.
 *
 * This is typically a context value key. But may also be any object with `key` property containing such key.
 *
 * @typeparam Value  A type of requested context value.
 * @typeparam Seed  Requested value seed type.
 */
export interface ContextRequest<Value, Seed = unknown> {

  /**
   * A key of context value to request.
   */
  readonly [ContextKey__symbol]: ContextKey<Value, any, Seed>;

}

export namespace ContextRequest {

  /**
   * Context request options.
   *
   * This can be passed to [[ContextValues.get]] method as a second parameter.
   *
   * @typeparam Value  A type of requested context value.
   */
  export interface Opts<Value> {

    /**
     * A fallback value that will be returned if there is no value associated with the given key.
     *
     * Can be `null` or `undefined`.
     */
    or?: Value | null;

  }

  export interface OrFallback<Value> extends Opts<Value> {
    or: Value;
  }

  export interface OrNull<Value> extends Opts<Value> {
    or: null;
  }

  export interface OrUndefined<Value> extends Opts<Value> {
    or?: undefined;
  }

}

/**
 * Context value definition target.
 *
 * Designates a declared declaring context value.
 *
 * @typeparam Src  A type of declared context value sources.
 * @typeparam Seed  Declared value seed type.
 */
export interface ContextTarget<Src, Seed = unknown> extends ContextRequest<any, Seed> {

  /**
   * A key of context value to provide.
   */
  readonly [ContextKey__symbol]: ContextKey<any, Src, Seed>;

}

/**
 * Context value reference that can serve both as [[ContextRequest]] and as [[ContextTarget]].
 *
 * @typeparam Value  Context value type.
 * @typeparam Src  Source value type.
 */
export interface ContextRef<Value, Src = Value>
    extends ContextRequest<Value>, ContextTarget<Src> {

  readonly [ContextKey__symbol]: ContextKey<Value, Src>;

}
