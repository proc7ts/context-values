/**
 * @packageDocumentation
 * @module @proc7ts/context-values
 */
import type { Supply, SupplyPeer } from '@proc7ts/primitives';
import type { ContextValueSlot } from './context-key';
import type { ContextRef } from './context-ref';
import { SimpleContextKey } from './simple-context-key';

/**
 * Context values supply.
 *
 * When available as context value, it is used to indicate the context is no longer used (e.g. destroyed).
 *
 * A context value provider can destroy the value it provides when this supply is cut off.
 */
export type ContextSupply = Supply;

/**
 * @internal
 */
class ContextSupplyKey extends SimpleContextKey<ContextSupply> {

  constructor() {
    super('context-supply');
  }

  grow(
      slot: ContextValueSlot<ContextSupply, ContextSupply, SimpleContextKey.Seed<ContextSupply>>,
  ): void {
    slot.insert(
        slot.seed()
        || (slot.hasFallback ? slot.or : null)
        || (slot.context as Partial<SupplyPeer>).supply,
    );
  }

}

/**
 * A key of context value containing a {@link ContextSupply context values supply}.
 *
 * It is not guaranteed to present.
 *
 * Predefined to the supply of the context if the latter implements `SupplyPeer` interface.
 */
export const ContextSupply: ContextRef<ContextSupply> = (/*#__PURE__*/ new ContextSupplyKey());
