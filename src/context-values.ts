/**
 * @packageDocumentation
 * @module @proc7ts/context-values
 */
import type { ContextRequest } from './context-ref';

/**
 * The values available from context.
 *
 * The values are available by their keys.
 */
export abstract class ContextValues {

  /**
   * Returns a value associated with the given key.
   *
   * @typeParam TValue  A type of associated value.
   * @param request - Context value request with target key.
   * @param opts - Context value request options.
   *
   * @returns Associated value or `null` when there is no associated value.
   */
  abstract get<TValue>(request: ContextRequest<TValue>, opts: ContextRequest.OrNull<TValue>): TValue | null;

  /**
   * Returns a value associated with the given key.
   *
   * @typeParam TValue  A type of associated value.
   * @param request - Context value request with target key.
   * @param opts - Context value request options.
   *
   * @returns Associated value or `undefined` when there is no associated value.
   */
  abstract get<TValue>(request: ContextRequest<TValue>, opts: ContextRequest.OrUndefined<TValue>): TValue | undefined;

  /**
   * Returns a value associated with the given key.
   *
   * @typeParam TValue  A type of associated value.
   * @param request - Context value request with target key.
   * @param opts - Context value request options.
   *
   * @returns Associated value. Or the default one when there is no associated value. Or key default when there is
   * neither.
   *
   * @throws Error  If there is no value associated with the given key, the default value is not provided,
   * and the key has no default value.
   */
  abstract get<TValue>(request: ContextRequest<TValue>, opts?: ContextRequest.OrFallback<TValue>): TValue;

}
