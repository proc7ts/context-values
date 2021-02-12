import type { ContextRef } from '../context-ref';
import type { ContextSeedKey } from './context-seed-key';
import type { ContextValueSlot } from './context-value-slot';

/**
 * A symbol of the property containing a {@link ContextKey} instance.
 */
export const ContextKey__symbol = (/*#__PURE__*/ Symbol('ContextKey'));

/**
 * Context value key.
 *
 * Every key should be an unique instance of this class.
 *
 * Multiple source values pay be provided per per value key. They all grouped into single seed.
 * The value is grown from this seed by {@link ContextKey.grow} method.
 *
 * @typeParam TValue - Context value type.
 * @typeParam TSrc - Source value type.
 * @typeParam TSeed - Value seed type.
 */
export abstract class ContextKey<TValue, TSrc = TValue, TSeed = unknown> implements ContextRef<TValue, TSrc> {

  /**
   * Human-readable key name.
   *
   * This is not necessarily unique.
   */
  readonly name: string;

  /**
   * A key of context value holding a seed of the value associated with this key.
   *
   * Different context value keys may have the same {@link seedKey} to grow them from the same seed.
   */
  abstract readonly seedKey: ContextSeedKey<TSrc, TSeed>;

  /**
   * Constructs context value key.
   *
   * @param name - Human-readable key name.
   */
  protected constructor(name: string) {
    this.name = name;
  }

  /**
   * Always the key itself.
   *
   * This is to use this context value key both as a context value request and its definition target.
   */
  get [ContextKey__symbol](): this {
    return this;
  }

  /**
   * Grows context value out of its seed.
   *
   * @param slot - Context value slot to insert the value to.
   */
  abstract grow(slot: ContextValueSlot<TValue, TSrc, TSeed>): void;

  toString(): string {
    return `ContextKey(${this.name})`;
  }

}
