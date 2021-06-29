import { Supply } from '@proc7ts/supply';
import { CxAsset } from './asset';
import { CxValues } from './values';

/**
 * Context modifier interface.
 */
export interface CxModifier<TContext extends CxValues = CxValues> {

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
