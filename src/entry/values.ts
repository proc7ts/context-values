import { Supply } from '@proc7ts/supply';
import { ContextSupply } from '../conventional';
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
  readonly supply?: ContextSupply;

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
     * Provides assets for the target context entry.
     *
     * @param entry - Context entry to provide assets for.
     * @param asset - Context entry asset to.
     */
    provide<TValue, TAsset = TValue>(
        entry: CxEntry<TValue, TAsset>,
        asset: CxAsset<TValue, TAsset, TContext>,
    ): Supply;

  }

  /**
   * Accessor to context values identified by their entries.
   */
  export interface Accessor {

    /**
     * Obtains a value of the given entry, or returns a fallback one.
     *
     * @typeParam TValue - Requested context value type.
     * @param entry - Context entry to obtain the value of.
     * @param request - Context value request with fallback specified.
     *
     * @returns Either context entry value, or a fallback one.
     */
    get<TValue>(entry: CxEntry<TValue, any>, request?: CxRequest.WithFallback<TValue>): TValue;

    /**
     * Obtains a value of the given entry.
     *
     * @typeParam TValue - Requested context value type.
     * @param entry - Context entry to obtain the value of.
     * @param request - Context value request.
     *
     * @returns Either context entry value, or a fallback one.
     *
     * @throws CxReferenceError - If the target `entry` has no value and fallback one is not provided.
     */
    get<TValue>(entry: CxEntry<TValue, any>, request?: CxRequest<TValue>): TValue | null;

  }

  /**
   * Context value getter signature.
   */
  export interface Getter {

    /**
     * Obtains a value of the given context entry, or returns a fallback one.
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
        request?: CxRequest.WithFallback<TValue>,
    ): TValue;

    /**
     * Obtains a value of the given context entry.
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

  /**
   * Context assets provider signature.
   *
   * Provides assets for the value of the `target` context entry to the given `receiver`.
   *
   * @typeParam TValue - Context value type.
   * @typeParam TAsset - Context value asset type.
   * @typeParam TContext - Context type.
   * @param target - Context entry definition target.
   * @param receiver - Value assets receiver.
   */
  export type Provider<TContext extends CxValues = CxValues> = <TValue, TAsset = TValue>(
      this: void,
      target: CxEntry.Target<TValue, TAsset, TContext>,
      receiver: CxAsset.Receiver<TAsset>,
  ) => void;

}
