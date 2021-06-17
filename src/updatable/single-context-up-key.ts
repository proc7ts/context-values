import { AfterEvent, afterEventBy, afterThe, digAfter, supplyAfter } from '@proc7ts/fun-events';
import { noop } from '@proc7ts/primitives';
import { ContextKeyError } from '../context-key-error';
import { ContextSupply } from '../conventional';
import type { ContextKeyDefault, ContextValueSlot } from '../key';
import { ContextUpKey, ContextUpRef } from './context-up-key';

/**
 * Single updatable context value reference.
 *
 * @typeParam TValue - Context value type.
 */
export type SingleContextUpRef<TValue> = ContextUpRef<AfterEvent<[TValue]>, TValue>;

/**
 * Single updatable context value key.
 *
 * The associated value is an `AfterEvent` keeper of the last source value. It is always present,
 * but signals an {@link ContextKeyError} error on attempt to receive an absent value.
 *
 * It is an error to provide a `null` or `undefined` {@link ContextRequest.Opts.or fallback value} when requesting
 * an associated value. Use an `afterThe()` result as a fallback instead.
 *
 * @typeParam TValue - Context value type.
 */
export class SingleContextUpKey<TValue>
    extends ContextUpKey<AfterEvent<[TValue]>, TValue>
    implements SingleContextUpRef<TValue> {

  /**
   * A provider of context value used when there is no value associated with this key.
   */
  readonly byDefault: ContextKeyDefault<TValue, ContextUpKey<AfterEvent<[TValue]>, TValue>>;

  get upKey(): this {
    return this;
  }

  /**
   * Constructs single updatable context value key.
   *
   * @param name - Human-readable key name.
   * @param seedKey - Value seed key. A new one will be constructed when omitted.
   * @param byDefault - Optional default value provider. If unspecified or `undefined` the key has no default
   * value.
   */
  constructor(
      name: string,
      {
        seedKey,
        byDefault = noop,
      }: {
        seedKey?: ContextUpKey.SeedKey<TValue>;
        byDefault?: ContextKeyDefault<TValue, ContextUpKey<AfterEvent<[TValue]>, TValue>>;
      } = {},
  ) {
    super(name, seedKey);
    this.byDefault = byDefault;
  }

  grow(
      slot: ContextValueSlot<
          AfterEvent<[TValue]>,
          ContextUpKey.Source<TValue>,
          AfterEvent<TValue[]>>,
  ): void {

    const value = slot.seed.do(digAfter((...sources: TValue[]): AfterEvent<TValue[]> => {
      if (sources.length) {
        // Sources present. Take the last one.
        return afterThe(sources[sources.length - 1]);
      }

      // Sources absent. Attempt to detect a fallback value.
      let fallback: AfterEvent<[TValue]> | null | undefined;

      if (slot.or !== undefined) {
        fallback = slot.or;
      } else {

        const defaultValue = this.byDefault(slot.context, this);

        if (defaultValue != null) {
          fallback = afterThe(defaultValue);
        }
      }
      if (fallback) {
        return fallback; // Fallback value found.
      }

      // Fallback value is absent. Construct an error response.
      return afterEventBy<[TValue]>(({ supply }) => {
        supply.off(new ContextKeyError(this));
      });
    }));

    slot.insert(value.do<AfterEvent<TValue[]>>(
        supplyAfter(slot.context.get(ContextSupply)),
    ));
  }

}
