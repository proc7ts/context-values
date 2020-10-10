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
 * @typeParam TValue  A type of requested context value.
 * @typeParam TSeed  Requested value seed type.
 */
export interface ContextRequest<TValue, TSeed = unknown> {

  /**
   * A key of context value to request.
   */
  readonly [ContextKey__symbol]: ContextKey<TValue, unknown, TSeed>;

}

export namespace ContextRequest {

  /**
   * Context request options.
   *
   * This can be passed to [[ContextValues.get]] method as a second parameter.
   *
   * @typeParam TValue  A type of requested context value.
   */
  export interface Opts<TValue> {

    /**
     * A fallback value that will be returned if there is no value associated with target key.
     *
     * Can be `null` or `undefined`.
     *
     * This property will be accessed only if there is no value associated with target key.
     */
    or?: TValue | null;

  }

  export interface OrFallback<TValue> extends Opts<TValue> {
    or: TValue;
  }

  export interface OrNull<TValue> extends Opts<TValue> {
    or: null;
  }

  export interface OrUndefined<TValue> extends Opts<TValue> {
    or?: undefined;
  }

}

/**
 * Context value definition target.
 *
 * Designates a declared declaring context value.
 *
 * @typeParam TSrc  A type of declared context value sources.
 * @typeParam TSeed  Declared value seed type.
 */
export interface ContextTarget<TSrc, TSeed = unknown> extends ContextRequest<unknown, TSeed> {

  /**
   * A key of context value to provide.
   */
  readonly [ContextKey__symbol]: ContextKey<unknown, TSrc, TSeed>;

}

/**
 * Context value reference that can serve both as [[ContextRequest]] and as [[ContextTarget]].
 *
 * @typeParam TValue  Context value type.
 * @typeParam TSrc  Source value type.
 */
export interface ContextRef<TValue, TSrc = TValue>
    extends ContextRequest<TValue>, ContextTarget<TSrc> {

  readonly [ContextKey__symbol]: ContextKey<TValue, TSrc>;

}
