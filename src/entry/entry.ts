import { CxAsset } from './asset';
import { CxValues } from './values';

/**
 * Context entry serves as a unique value key withing context.
 *
 * It also responsible for building the value based of its assets.
 *
 * @typeParam TValue - Context value type.
 * @typeParam TAsset - Context value asset type.
 */
export interface CxEntry<TValue, TAsset = TValue> {

  /**
   * Starts the definition of context entry.
   *
   * This is the only method to be implemented by context entry.
   *
   * @param target - Definition target.
   *
   * @returns New context entry definition instance.
   */
  perContext(target: CxEntry.Target<TValue, TAsset>): CxEntry.Definition<TValue, TAsset>;

}

export namespace CxEntry {

  /**
   * Context entry definition target.
   *
   * Passed to {@link CxEntry.perContext context entry} to start the definition.
   *
   * Allows to access context values and provide assets for them.
   *
   * @typeParam TValue - Context value type.
   * @typeParam TAsset - Context value asset type.
   */
  export interface Target<
      TValue,
      TAsset = TValue,
      TContext extends CxValues = CxValues
      > extends CxValues.Accessor, CxValues.Modifier<TContext> {

    /**
     * Context entry to define.
     */
    readonly entry: CxEntry<TValue, TAsset>;

  }

  /**
   * Context entry definition.
   *
   * The entry is defined based on value assets provided by entry definition {@link Peer peers}.
   *
   * The definition is {@link CxEntry.perContext started} for context entry at most once per context.
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
    provideAssets(receiver: CxAsset.Receiver<TAsset>): void;

  }

}
