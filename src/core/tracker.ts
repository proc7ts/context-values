import { Supply, SupplyPeer } from '@proc7ts/supply';
import { CxTracking } from './tracking';

/**
 * Value changes tracker.
 *
 * @typeParam T - Tracked value type.
 */
export interface CxTracker<T> extends SupplyPeer {

  /**
   * Tracking supply.
   *
   * Once cut off the tracker stops any tracking. E.g. the {@link get} method would throw after that.
   */
  readonly supply: Supply;

  /**
   * Accesses current value.
   *
   * @returns Most recent tracked value.
   *
   * @throws CxReferenceError  if {@link supply tracking supply} cut off or there is no current value.
   */
  get(this: void): T;

  /**
   * Passes current value to the given receiver.
   *
   * Does nothing if there is not current value.
   *
   * @param receiver - Current value receiver.
   */
  to(this: void, receiver: CxTracking.MandatoryReceiver<T>): void;

  /**
   * Starts value tracking.
   *
   * Passes current value assets to the given `receiver` function, then sends it again on each update, until the
   * returned tracking supply cut off.
   *
   * @param receiver - Value receiver.
   * @param tracking - Tacking options.
   *
   * @returns Tracking supply. Stops tracking once cut off.
   */
  track(this: void, receiver: CxTracking.Receiver<T>, tracking?: CxTracking): Supply;

}

export namespace CxTracker {

  /**
   * Mandatory value changes tracker.
   *
   * In contrast to {@link CxTracker generic tracker} this one always has current value.
   *
   * @typeParam T - Tracked value type.
   */
  export interface Mandatory<T> extends CxTracker<T> {

    /**
     * Starts value tracking.
     *
     * Passes current value assets to the given `receiver` function, then sends it again on each update, until the
     * returned tracking supply cut off.
     *
     * @param receiver - Value receiver.
     * @param tracking - Tacking options.
     *
     * @returns Tracking supply. Stops tracking once cut off.
     */
    track(this: void, receiver: CxTracking.MandatoryReceiver<T>, tracking?: CxTracking): Supply;

  }

}
