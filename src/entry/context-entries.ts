import { Supply } from '@proc7ts/supply';
import { ContextAsset } from './context-asset';
import { ContextEntry } from './context-entry';

/**
 * The value entries of context.
 *
 * The values identified by their entries.
 */
export interface ContextEntries {

  /**
   * Obtains a value of the given entry, or returns a fallback one.
   *
   * @typeParam TValue - Requested context value type.
   * @param entry - Context entry to obtain the value of.
   * @param request - Context value request with fallback specified.
   *
   * @returns Either context entry value, or a fallback one.
   */
  get<TValue>(entry: ContextEntry<TValue, any>, request?: ContextEntry.RequestWithFallback<TValue>): TValue;

  /**
   * Obtains a value of the given entry.
   *
   * @typeParam TValue - Requested context value type.
   * @param entry - Context entry to obtain the value of.
   * @param request - Context value request.
   *
   * @returns Either context entry value, or a fallback one.
   *
   * @throws ContextEntryError - If the target `entry` has no value and fallback one is not provided.
   */
  get<TValue>(entry: ContextEntry<TValue, any>, request: ContextEntry.Request<TValue>): TValue | null;

}

export namespace ContextEntries {

  /**
   * Context entries editor interface.
   */
  export interface Editor<TContext extends ContextEntries = ContextEntries> {

    /**
     * A context to add assets to.
     */
    readonly context: TContext;

    /**
     * Provides assets for the target context entry.
     *
     * @param entry - Context entry to provide assets for.
     * @param asset - Context entry asset to.
     */
    provide<TValue, TAsset = TValue>(
        entry: ContextEntry<TValue, TAsset>,
        asset: ContextAsset<TValue, TAsset, TContext>,
    ): Supply;

  }

  /**
   * Context value accessor signature.
   */
  export interface Accessor {

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
        entry: ContextEntry<TValue, any>,
        request?: ContextEntry.RequestWithFallback<TValue>,
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
     * @throws ContextEntryError - If the target `entry` has no value and fallback one is not provided.
     */
    <TValue>(
        entry: ContextEntry<TValue, any>,
        request: ContextEntry.Request<TValue>,
    ): TValue | null;

  }

  /**
   * Context entries provider signature.
   *
   * Provides assets for the value of the `target` context entry to the given `receiver`.
   *
   * @typeParam TValue - Context value type.
   * @typeParam TAsset - Context value asset type.
   * @typeParam TContext - Context type.
   * @param target - Context entry definition target.
   * @param receiver - Value assets receiver.
   */
  export type Provider<TContext extends ContextEntries = ContextEntries> = <TValue, TAsset = TValue>(
      this: void,
      target: ContextEntry.Target<TValue, TAsset, TContext>,
      receiver: ContextAsset.Receiver<TAsset>,
  ) => void;

}
