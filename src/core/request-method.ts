/**
 * Context value request method.
 *
 * {@link CxRequest.by Specifies} how to obtain the value.
 */
export enum CxRequestMethod {
  /**
   * Requests any available value.
   *
   * The same as if no {@link CxRequest.by request method} specified.
   *
   * Calls {@link CxEntry.Definition.assign} method. If no value assigned, calls
   * {@link CxEntry.Definition.assignDefault} one. If no value assigned in turn, uses a {@link CxRequest.or fallback}
   * one if specified, or throws {@link CxReferenceError} otherwise.
   *
   * When passed to {@link CxRequest.set} callback means the assigned value is a {@link CxRequest.or fallback} one.
   */
  Fallback = 0,

  /**
   * Requests the value by context entry defaults.
   *
   * Calls {@link CxEntry.Definition.assignDefault} method. If no value assigned, uses a {@link CxRequest.or fallback}
   * one if specified, or throws {@link CxReferenceError} otherwise.
   *
   * When passed to {@link CxRequest.set} callback means the value is a {@link CxEntry.Definition.assignDefault default}
   * one.
   */
  Defaults = -1,

  /**
   * Requests the value {@link CxModifier.provide provided} by context entry assets.
   *
   * Calls {@link CxEntry.Definition.assign} method. If no value assigned, uses a {@link CxRequest.or fallback} one
   * if specified, or throws {@link CxReferenceError} otherwise.
   *
   * When passed to {@link CxRequest.set} callback means the value is {@link CxEntry.Definition.assign provided} by
   * entry assets.
   */
  Assets = 1,
}
