/**
 * @packageDocumentation
 * @module @proc7ts/context-values/updatable
 */
import { noop } from '@proc7ts/call-thru';
import { EventSupply, EventSupply__symbol, EventSupplyPeer } from '@proc7ts/fun-events';
import { ContextValueOpts } from '../context-key';
import { ContextRef } from '../context-ref';
import { SimpleContextKey } from '../simple-context-key';

/**
 * Context values supply.
 *
 * When available as context value, it is used to indicate the context is no longer used (e.g. destroyed).
 *
 * A context value provider can destroy the value it provides when this supply is cut off.
 */
export type ContextSupply = EventSupply;

/**
 * @internal
 */
class ContextSupplyKey extends SimpleContextKey<ContextSupply> {

  constructor() {
    super('context-supply');
  }

  grow(
      opts: ContextValueOpts<ContextSupply, ContextSupply, SimpleContextKey.Seed<ContextSupply>>,
  ): ContextSupply | null | undefined {
    return opts.seed()
        || opts.or
        || (opts.context as Partial<EventSupplyPeer>)[EventSupply__symbol]
        || opts.byDefault(noop);
  }

}

/**
 * A key of context value containing a {@link ContextSupply context values supply}.
 *
 * It is not guaranteed to present.
 *
 * Predefined to the supply of the context if the latter implements `EventSupplyPeer` interface.
 */
export const ContextSupply: ContextRef<ContextSupply> = (/*#__PURE__*/ new ContextSupplyKey());
