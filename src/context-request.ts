/* istanbul ignore next */
import { ContextKey, ContextKey__symbol } from './key';

/**
 * A request for context value.
 *
 * This is passed to {@link ContextValues.get} methods in order to obtain a context value.
 *
 * This is typically a context value key. But may also be any object with `key` property containing such key.
 *
 * @typeParam TValue - A type of requested context value.
 * @typeParam TSeed - Requested value seed type.
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
   * This can be passed to {@link ContextValues.get} method as a second parameter.
   *
   * @typeParam TValue - A type of requested context value.
   */
  export interface Opts<TValue> {

    /**
     * A fallback value that will be returned if there is no value associated with target key.
     *
     * Can be `null`. `undefined` means there is no fallback.
     *
     * This property will be accessed only if there is no value associated with target key.
     */
    or?: TValue | null | undefined;

  }

  export interface OrFallback<TValue> extends Opts<TValue> {
    or: TValue;
  }

  export interface OrNull<TValue> extends Opts<TValue> {
    or: null;
  }

}
