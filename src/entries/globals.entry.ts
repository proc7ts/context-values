import { CxEntry, CxValues } from '../core';
import { cxSingle } from './single.entry';

/**
 * Global values context.
 *
 * Contains values available globally for the whole application.
 *
 * It is expected that there is exactly one global context exists per application.
 */
export type CxGlobals = CxValues;

/**
 * Context entry containing {@link CxGlobals global values context}.
 *
 * Services may utilize this instance as a {@link cxScoped scope} to make sure the service instance is singleton.
 *
 * It is an application (or framework) responsibility to provide a global context.
 */
export const CxGlobals: CxEntry<CxGlobals> = {
  perContext: /*#__PURE__*/ cxSingle(),
  toString: () => '[CxGlobal]',
};
