import { CxEntry } from './entry';
import { CxRequest } from './request';

/**
 * Context value getter signature.
 */
export interface CxGetter {

  /**
   * Obtains a value of the given context entry.
   *
   * @typeParam TValue - Requested context value type.
   * @param entry - Context entry to obtain the value of.
   * @param request - Context value request with fallback specified.
   *
   * @returns Either context entry value, or a fallback one.
   */
      <TValue>(
      this: void,
      entry: CxEntry<TValue, unknown>,
      request?: CxRequest.WithoutFallback<TValue>,
  ): TValue;

  /**
   * Obtains a value of the given context entry, or returns a non-nullable fallback.
   *
   * @typeParam TValue - Requested context value type.
   * @param entry - Context entry to obtain the value of.
   * @param request - Context value request with fallback specified.
   *
   * @returns Either context entry value, or a fallback one.
   */
      <TValue>(
      this: void,
      entry: CxEntry<TValue, any>,
      request: CxRequest.WithFallback<TValue>,
  ): TValue;

  /**
   * Obtains a value of the given context entry, or returns a nullable fallback.
   *
   * @typeParam TValue - Requested context value type.
   * @param entry - Context entry to obtain the value of.
   * @param request - Context value request.
   *
   * @returns Either context entry value, or a fallback one.
   *
   * @throws CxReferenceError - If the target `entry` has no value and fallback one is not provided.
   */
      <TValue>(
      entry: CxEntry<TValue, any>,
      request?: CxRequest<TValue>,
  ): TValue | null;

}
