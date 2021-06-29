import { Supply } from '@proc7ts/supply';
import { CxAccessor } from './accessor';

/**
 * The values available in context, identified by their entries.
 */
export interface CxValues extends CxAccessor {

  /**
   * Context values supply.
   *
   * When provided, this value is available as {@link ContextSupply} entry, unless overridden.
   */
  readonly supply?: Supply;

}
