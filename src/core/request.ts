/**
 * Context value request.
 *
 * This can be passed to {@link CxValues.get} method as second parameter.
 *
 * @typeParam TValue - Requested context value type.
 */
export interface CxRequest<TValue> {

  /**
   * A fallback value to use if there is no value {@link Definition.get available} for requested entry.
   *
   * Can be `null`. `undefined` means there is no fallback.
   */
  readonly or?: TValue | null | undefined;

}

export namespace CxRequest {

  /**
   * Context value request with fallback specified.
   *
   * This can be passed to {@link CxValues.get} method as second parameter.
   *
   * @typeParam TValue - Requested context value type.
   */
  export interface WithFallback<TValue> extends CxRequest<TValue> {

    /**
     * A fallback value to use if there is no value {@link Definition.get available} for requested entry.
     */
    readonly or: TValue;

  }

}
