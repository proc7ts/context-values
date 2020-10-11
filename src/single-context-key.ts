/**
 * @packageDocumentation
 * @module @proc7ts/context-values
 */
import { noop } from '@proc7ts/primitives';
import type { ContextKey, ContextKeyDefault, ContextSeedKey, ContextValueSlot } from './context-key';
import type { ContextRef } from './context-ref';
import { SimpleContextKey } from './simple-context-key';

/**
 * Single context value reference.
 *
 * @typeParam TValue  Context value type.
 */
export type SingleContextRef<TValue> = ContextRef<TValue, TValue>;

/**
 * Single context value key.
 *
 * Treats the last source value as context one and ignores the rest of them.
 *
 * @typeParam TValue  Context value type.
 */
export class SingleContextKey<TValue>
    extends SimpleContextKey<TValue>
    implements SingleContextRef<TValue> {

  /**
   * A provider of context value used when there is no value associated with this key.
   */
  readonly byDefault: ContextKeyDefault<TValue, ContextKey<TValue>>;

  /**
   * Constructs single context value key.
   *
   * @param name  Human-readable key name.
   * @param seedKey  Value seed key. A new one will be constructed when omitted.
   * @param byDefault  Optional default value provider. If unspecified or `undefined` the key has no default
   * value.
   */
  constructor(
      name: string,
      {
        seedKey,
        byDefault = noop,
      }: {
        seedKey?: ContextSeedKey<TValue, SimpleContextKey.Seed<TValue>>;
        byDefault?: ContextKeyDefault<TValue, ContextKey<TValue>>;
      } = {},
  ) {
    super(name, { seedKey });
    this.byDefault = byDefault;
  }

  grow(
      slot: ContextValueSlot<TValue, TValue, SimpleContextKey.Seed<TValue>>,
  ): void {

    const value = slot.seed();

    if (value != null) {
      slot.insert(value);
    } else if (!slot.hasFallback) {
      slot.insert(this.byDefault(slot.context, this));
    }
  }

}
