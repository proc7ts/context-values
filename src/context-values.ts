import type { ContextRequest } from './context-request';
import type { ContextSupply } from './conventional';

/**
 * The values available from context.
 *
 * The values are available by their keys.
 */
export interface ContextValues {

  /**
   * Context values supply.
   *
   * When provided, this value is available under {@link ContextSupply} key, unless overridden.
   */
  readonly supply?: ContextSupply;

  /**
   * Returns a value associated with the given key, or a fallback one.
   *
   * @typeParam TValue - A type of associated value.
   * @param request - Context value request with target key.
   * @param opts - Context value request options.
   *
   * @returns Either associated value, or a fallback one,.
   */
  get<TValue>(request: ContextRequest<TValue>, opts?: ContextRequest.OrFallback<TValue>): TValue;

  /**
   * Returns a value associated with the given key.
   *
   * @typeParam TValue - A type of associated value.
   * @param request - Context value request with target key.
   * @param opts - Context value request options.
   *
   * @returns Either associated value, a specified fallback one, or default one when there is neither.
   *
   * @throws ContextKeyError  If there is no value associated with the given key, the default value is not provided,
   * and the key has no default value.
   */
  get<TValue>(request: ContextRequest<TValue>, opts: ContextRequest.Opts<TValue>): TValue | null;

}
