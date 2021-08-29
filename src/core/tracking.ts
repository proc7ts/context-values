import { Supply } from '@proc7ts/supply';
import { CxRequestMethod } from './request-method';

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
  readonly supply?: Supply | undefined;

}

export namespace CxTracking {

  /**
   * Mandatory tracked value receiver signature.
   *
   * It is used when expected that the current value is always present.
   *
   * @typeParam T - Tracked value type.
   * @param value - Current value.
   * @param by - The method the current value received by.
   */
  export type MandatoryReceiver<T> = (this: void, value: T, by: CxRequestMethod) => void;

  /**
   * Tracked value receiver signature.
   *
   * Accepts current value and the method it is received by as parameters. Receives no arguments if there is no current
   * value.
   *
   * @typeParam T - Tracked value type.
   */
  export type Receiver<T> = (
      this: void,
      ...args: [value: T, by: CxRequestMethod] | [undefined?, undefined?]
  ) => void;

}
