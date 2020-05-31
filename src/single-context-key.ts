/**
 * @packageDocumentation
 * @module @proc7ts/context-values
 */
import { noop } from '@proc7ts/primitives';
import { ContextKey, ContextKeyDefault, ContextSeedKey, ContextValueSlot } from './context-key';
import { ContextRef } from './context-ref';
import { SimpleContextKey } from './simple-context-key';

/**
 * Single context value reference.
 *
 * @typeparam Value  Context value type.
 */
export type SingleContextRef<Value> = ContextRef<Value, Value>;

/**
 * Single context value key.
 *
 * Treats the last source value as context one and ignores the rest of them.
 *
 * @typeparam Value  Context value type.
 */
export class SingleContextKey<Value>
    extends SimpleContextKey<Value>
    implements SingleContextRef<Value> {

  /**
   * A provider of context value used when there is no value associated with this key.
   */
  readonly byDefault: ContextKeyDefault<Value, ContextKey<Value>>;

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
        seedKey?: ContextSeedKey<Value, SimpleContextKey.Seed<Value>>;
        byDefault?: ContextKeyDefault<Value, ContextKey<Value>>;
      } = {},
  ) {
    super(name, { seedKey });
    this.byDefault = byDefault;
  }

  grow(
      slot: ContextValueSlot<Value, Value, SimpleContextKey.Seed<Value>>,
  ): void {

    const value = slot.seed();

    if (value != null) {
      slot.insert(value);
    } else if (!slot.hasFallback) {
      slot.insert(this.byDefault(slot.context, this));
    }
  }

}
