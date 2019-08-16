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
 * @typeparam Value  A type of requested context value.
 */
export interface ContextRequest<Value> {

  /**
   * A key of context value to request.
   */
  readonly key: ContextKey<Value, any>;

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
