/**
 * @module context-values
 */
import { ContextRequest } from './context-request';

/**
 * The values available from context.
 *
 * The values are available by their keys.
 */
export abstract class ContextValues {

  /**
   * Returns a value associated with the given key.
   *
   * @typeparam Value  A type of associated value.
   * @param request  Context value request with target key.
   * @param opts  Context value request options.
   *
   * @returns Associated value or `null` when there is no associated value.
   */
  abstract get<Value>(request: ContextRequest<Value>, opts: ContextRequest.OrNull<Value>): Value | null;

  /**
   * Returns a value associated with the given key.
   *
   * @typeparam Value  A type of associated value.
   * @param request  Context value request with target key.
   * @param opts  Context value request options.
   *
   * @returns Associated value or `undefined` when there is no associated value.
   */
  abstract get<Value>(request: ContextRequest<Value>, opts: ContextRequest.OrUndefined<Value>): Value | undefined;

  /**
   * Returns a value associated with the given key.
   *
   * @typeparam Value  A type of associated value.
   * @param request  Context value request with target key.
   * @param opts  Context value request options.
   *
   * @returns Associated value. Or the default one when there is no associated value. Or key default when there is
   * neither.
   *
   * @throws Error  If there is no value associated with the given key, the default value is not provided,
   * and the key has no default value.
   */
  abstract get<Value>(request: ContextRequest<Value>, opts?: ContextRequest.OrFallback<Value>): Value;

}
