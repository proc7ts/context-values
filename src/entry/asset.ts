import { Supply } from '@proc7ts/supply';
import { CxEntry } from './entry';
import { CxValues } from './values';

/**
 * Context entry asset.
 *
 * Used to provide assets of the value of specific context entry.
 *
 * @typeParam TValue - Context value type.
 * @typeParam TAsset - Context value asset type.
 * @typeParam TContext - Context type.
 */
export type CxAsset<TValue, TAsset = TValue, TContext extends CxValues = CxValues> =
    CxAsset.Provider<TValue, TAsset, TContext>;

export namespace CxAsset {

  /**
   * Context value assets provider signature.
   *
   * Provides assets for the value of the `target` context entry to the given `receiver`.
   *
   * @typeParam TValue - Context value type.
   * @typeParam TAsset - Context value asset type.
   * @typeParam TContext - Context type.
   * @param target - Context entry definition target.
   * @param receiver - Value assets receiver.
   */
  export type Provider<TValue, TAsset = TValue, TContext extends CxValues = CxValues> = (
      this: void,
      target: CxEntry.Target<TValue, TAsset, TContext>,
      receiver: CxAsset.Receiver<TAsset>,
  ) => void;

  /**
   * Context value assets receiver.
   *
   * @typeParam TAsset - Context value asset type.
   * @param asset - Provided asset.
   * @param supply - Asset supply. The `asset` is revoked once cut off.
   */
  export type Receiver<TAsset> = (this: void, asset: TAsset, supply: Supply) => void;

}
