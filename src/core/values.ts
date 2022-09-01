import { CxEntry } from './entry';
import { CxRequest } from './request';

/**
 * The values available in context, identified by their entries.
 */
export interface CxValues {
  /**
   * Obtains value of the given context entry.
   *
   * @typeParam TValue - Requested context value type.
   * @param entry - Context entry to obtain the value of.
   * @param request - Context value request with fallback specified.
   *
   * @returns Either context entry value, or a fallback one.
   */
  get<TValue>(entry: CxEntry<TValue, unknown>, request?: CxRequest.WithoutFallback<TValue>): TValue;

  /**
   * Obtains value of the given context entry, or returns a non-nullable fallback.
   *
   * @typeParam TValue - Requested context value type.
   * @param entry - Context entry to obtain the value of.
   * @param request - Context value request with fallback specified.
   *
   * @returns Either context entry value, or a fallback one.
   */
  get<TValue>(entry: CxEntry<TValue, unknown>, request: CxRequest.WithFallback<TValue>): TValue;

  /**
   * Obtains value of the given context entry, or returns a nullable fallback.
   *
   * @typeParam TValue - Requested context value type.
   * @param entry - Context entry to obtain the value of.
   * @param request - Context value request.
   *
   * @returns Either context entry value, or a fallback one.
   *
   * @throws CxReferenceError - If the target `entry` has no value and fallback one is not provided.
   */
  get<TValue>(entry: CxEntry<TValue, unknown>, request?: CxRequest<TValue>): TValue | null;
}
