/**
 * @module context-values
 */
import { ContextKey } from './context-key';

/**
 * A request for context value.
 *
 * This is passed to [[ContextValues.get]] methods in order to obtain a context value.
 *
 * This is typically a context value key. But may also be any object with `key` property containing such key.
 *
 * @typeparam V  A type of requested context value.
 */
export interface ContextRequest<V> {

  /**
   * A key of context value to request.
   */
  readonly key: ContextKey<V, any>;

}

export namespace ContextRequest {

  /**
   * Context request options.
   *
   * This can be passed to [[ContextValues.get]] method as a second parameter.
   *
   * @typeparam V  A type of requested context value.
   */
  export interface Opts<V> {

    /**
     * A fallback value that will be returned if there is no value associated with the given key.
     *
     * Can be `null` or `undefined`.
     */
    or?: V | null;

  }

  export interface OrFallback<V> extends Opts<V> {
    or: V;
  }

  export interface OrNull<V> extends Opts<V> {
    or: null;
  }

  export interface OrUndefined<V> extends Opts<V> {
    or?: undefined;
  }

}
