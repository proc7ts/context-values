/**
 * @packageDocumentation
 * @module @proc7ts/context-values
 */
import type { Supply } from '@proc7ts/primitives';
import { alwaysSupply } from '@proc7ts/primitives';
import type { ContextValueSlot } from './context-key';
import type { ContextRef } from './context-ref';
import { SimpleContextKey } from './simple-context-key';

/**
 * Context values supply.
 *
 * It is used to signal when context is no longer used (e.g. destroyed).
 *
 * A context value provider can (and probably should) destroy the provided value in such case.
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
        || slot.context.supply
        || (slot.hasFallback ? slot.or : alwaysSupply()),
    );
  }

}

/**
 * A key of context value containing a {@link ContextSupply context values supply}.
 *
 * It is guaranteed to present.
 *
 * Predefined to the supply of the context if the latter implements `SupplyPeer` interface. Defaults to supply-always
 * otherwise.
 */
export const ContextSupply: ContextRef<ContextSupply> = (/*#__PURE__*/ new ContextSupplyKey());
