import { CxRequestMethod } from './request-method';

/**
 * Context value request.
 *
 * This can be passed to {@link CxAccessor.get} method as second parameter.
 *
 * @typeParam TValue - Requested context value type.
 */
export interface CxRequest<TValue> {

  /**
   * A fallback value to use if there is no value {@link Definition.assign available} for requested entry.
   *
   * Can be `null`. `undefined` means there is no fallback.
   */
  readonly or?: TValue | null | undefined;

  /**
   * Request method.
   *
   * Specifies how to obtain the value. E.g. it can be used to request only {@link CxRequestMethod.Defaults default}
   * one.
   */
  readonly by?: CxRequestMethod;

  /**
   * Assigns the value.
   *
   * When specified, this method is called right before returning the value from {@link CxAccessor.get} call. It won't
   * be called if there is no value to return.
   *
   * @param value - The {@link CxEntry.Definition.assign value} or {@link CxEntry.Definition.assignDefault default
   * value} assigned to entry, or a {@link or fallback} one.
   * @param by - The request method the value is obtained by.
   */
  set?(this: void, value: TValue | null, by: CxRequestMethod): void;

}

export namespace CxRequest {

  /**
   * Context value request with fallback specified.
   *
   * Can be passed to {@link CxAccessor.get} method as second parameter.
   *
   * @typeParam TValue - Requested context value type.
   */
  export interface WithFallback<TValue> extends CxRequest<TValue> {

    /**
     * A fallback value to use if there is no value {@link Definition.assign available} for requested entry.
     */
    readonly or: TValue;

    set?(this: void, value: TValue, by: CxRequestMethod): void;

  }

  /**
   * Context value request without fallback specified.
   *
   * Can be passed to {@link CxAccessor.get} method as second parameter.
   *
   * @typeParam TValue - Requested context value type.
   */
  export interface WithoutFallback<TValue> extends CxRequest<TValue> {

    readonly or?: undefined;

    set?(this: void, value: TValue, by: CxRequestMethod): void;

  }

}
