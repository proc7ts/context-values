import { ContextAsset } from './context-asset';
import { ContextEntries } from './context-entries';

/**
 * Context entry serves as a unique value key withing context.
 *
 * It also responsible for building the value based of its assets.
 *
 * @typeParam TValue - Context value type.
 * @typeParam TAsset - Context value asset type.
 */
export interface ContextEntry<TValue, TAsset = TValue> {

  /**
   * Starts the definition of context entry.
   *
   * This is the only method to be implemented by context entry.
   *
   * @param target - Definition target.
   *
   * @returns New context entry definition instance.
   */
  perContext(target: ContextEntry.Target<TValue, TAsset>): ContextEntry.Definition<TValue, TAsset>;

}

export namespace ContextEntry {

  /**
   * Context entry definition target.
   *
   * Passed to {@link ContextEntry.perContext context entry} to start the definition.
   *
   * Allows to access context values and provide assets for them.
   *
   * @typeParam TValue - Context value type.
   * @typeParam TAsset - Context value asset type.
   */
  export interface Target<
      TValue,
      TAsset = TValue,
      TContext extends ContextEntries = ContextEntries
      > extends ContextEntries, ContextEntries.Editor<TContext> {

    /**
     * Context entry to define.
     */
    readonly entry: ContextEntry<TValue, TAsset>;

  }

  /**
   * Context entry definition.
   *
   * The entry is defined based on value assets provided by entry definition {@link Peer peers}.
   *
   * The definition is {@link ContextEntry.perContext started} for context entry at most once per context.
   *
   * @typeParam TValue - Context value type.
   * @typeParam TAsset - Context value asset type.
   */
  export interface Definition<TValue, TAsset = TValue> {

    /**
     * Add a peer of this context entry definition.
     *
     * @param peer - A peer to add.
     */
    addPeer(peer: Peer<TAsset>): void;

    /**
     * Returns context entry value.
     *
     * When defined, this method is tried first when accessing the context entry value.
     *
     * When not defined or `null`/`undefined` returned, the {@link Request.or fallback} value is used. If the latter is
     * not available, the {@link getDefault default value} is used instead.
     *
     * @returns Either entry value, or `null`/`undefined` if the value is not available.
     */
    get?(): TValue | null | undefined;

    /**
     * Returns the default context entry value.
     *
     * When defined, this method is tried if there is no {@link get value} available for the entry, and no
     * {@link Request.or fallback} provided.
     *
     * @returns Either default value for the entry, or `null`/`undefined` if the default value is not available.
     */
    getDefault?(): TValue | null | undefined;

  }

  /**
   * A peer of context entry definition.
   *
   * It is able to {@link provideAssets provide assets} for entry value in particular context.
   *
   * @typeParam TAsset - Context value asset type.
   */
  export interface Peer<TAsset> {

    /**
     * Provides value assets to target `receiver`.
     *
     * @param receiver - Value assets receiver.
     */
    provideAssets(receiver: ContextAsset.Receiver<TAsset>): void;

  }

  /**
   * Context value request.
   *
   * This can be passed to {@link ContextEntries.get} method as second parameter.
   *
   * @typeParam TValue - Requested context value type.
   */
  export interface Request<TValue> {

    /**
     * A fallback value to use if there is no value {@link Definition.get available} for requested entry.
     *
     * Can be `null`. `undefined` means there is no fallback.
     */
    readonly or?: TValue | null | undefined;

  }

  /**
   * Context value request with fallback specified.
   *
   * This can be passed to {@link ContextEntries.get} method as second parameter.
   *
   * @typeParam TValue - Requested context value type.
   */
  export interface RequestWithFallback<TValue> extends Request<TValue> {

    /**
     * A fallback value to use if there is no value {@link Definition.get available} for requested entry.
     */
    readonly or: TValue;

  }

}
