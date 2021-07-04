import { Supply } from '@proc7ts/supply';

/**
 * Options for value tracking.
 */
export interface CxTracking {

  /**
   * Tracking supply.
   *
   * Stops tracking once cut off.
   *
   * Returned from tracking method when present. New instance will be constructed when omitted.
   */
  readonly supply?: Supply;

}
