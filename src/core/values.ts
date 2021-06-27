import { Supply } from '@proc7ts/supply';
import { CxAsset } from './asset';
import { CxEntry } from './entry';
import { CxRequest } from './request';

/**
 * The values available in context, identified by their entries.
 */
export interface CxValues extends CxValues.Accessor {

  /**
   * Context values supply.
   *
   * When provided, this value is available as {@link ContextSupply} entry, unless overridden.
   */
  readonly supply?: Supply;

}

export namespace CxValues {

  /**
   * Context modifier interface.
   */
  export interface Modifier<TContext extends CxValues = CxValues> {

    /**
     * Modified context.
     */
    readonly context: TContext;

    /**
     * Provides an asset for context {@link CxAsset.entry entry}.
     *
     * @typeParam TValue - Context value type.
     * @typeParam TAsset - Context value asset type.
     * @param asset - Context entry asset.
     *
     * @returns Asset supply. Revokes provided asset once cut off.
     */
    provide<TValue, TAsset = TValue>(asset: CxAsset<TValue, TAsset, TContext>): Supply;

  }

  /**
   * Accessor to context values identified by their entries.
   */
  export interface Accessor {

    /**
     * Obtains a value of the given context entry.
     *
     * @typeParam TValue - Requested context value type.
     * @param entry - Context entry to obtain the value of.
     * @param request - Context value request with fallback specified.
     *
     * @returns Either context entry value, or a fallback one.
     */
    get<TValue>(entry: CxEntry<TValue, unknown>, request?: CxRequest.WithoutFallback<TValue>): TValue;

    /**
     * Obtains a value of the given context entry, or returns a non-nullable fallback.
     *
     * @typeParam TValue - Requested context value type.
     * @param entry - Context entry to obtain the value of.
     * @param request - Context value request with fallback specified.
     *
     * @returns Either context entry value, or a fallback one.
     */
    get<TValue>(entry: CxEntry<TValue, unknown>, request: CxRequest.WithFallback<TValue>): TValue;

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
    get<TValue>(entry: CxEntry<TValue, unknown>, request?: CxRequest<TValue>): TValue | null;

  }

  /**
   * Context value getter signature.
   */
  export interface Getter {

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

}
