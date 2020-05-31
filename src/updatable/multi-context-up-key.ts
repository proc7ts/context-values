/**
 * @packageDocumentation
 * @module @proc7ts/context-values/updatable
 */
import { nextArgs } from '@proc7ts/call-thru';
import { AfterEvent, afterEventBy, afterThe, EventKeeper, nextAfterEvent } from '@proc7ts/fun-events';
import { noop } from '@proc7ts/primitives';
import { ContextKeyDefault, ContextValueSlot } from '../context-key';
import { ContextKeyError } from '../context-key-error';
import { ContextSupply } from './context-supply';
import { ContextUpKey, ContextUpRef } from './context-up-key';

/**
 * Multiple updatable context values reference.
 *
 * @typeparam Src  Source value type.
 */
export type MultiContextUpRef<Src> = ContextUpRef<AfterEvent<Src[]>, Src>;

/**
 * Multiple updatable context values key.
 *
 * The associated value is an `AfterEvent` keeper of the source values. It is always present, even though
 * the array can be empty.
 *
 * It is an error to provide a `null` or `undefined` {@link ContextRequest.Opts.or fallback value} when requesting
 * an associated value. Use an `afterThe()` result as a fallback instead.
 *
 * @typeparam Src  Source value type.
 */
export class MultiContextUpKey<Src>
    extends ContextUpKey<AfterEvent<Src[]>, Src>
    implements MultiContextUpRef<Src> {

  /**
   * A provider of context value used when there is no value associated with this key.
   */
  readonly byDefault: ContextKeyDefault<readonly Src[], ContextUpKey<AfterEvent<Src[]>, Src>>;

  get upKey(): this {
    return this;
  }

  /**
   * Constructs multiple updatable context value key.
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
        seedKey?: ContextUpKey.SeedKey<Src>;
        byDefault?: ContextKeyDefault<readonly Src[], ContextUpKey<AfterEvent<Src[]>, Src>>;
      } = {},
  ) {
    super(name, seedKey);
    this.byDefault = byDefault;
  }

  grow(
      slot: ContextValueSlot<AfterEvent<Src[]>, EventKeeper<Src[]> | Src, AfterEvent<Src[]>>,
  ): void {

    const value = slot.seed.keepThru((...sources) => {
      if (sources.length) {
        // Sources present. Use them.
        return nextArgs(...sources);
      }

      // Sources absent. Attempt to detect the backup value.
      let backup: AfterEvent<Src[]> | null | undefined;

      if (slot.hasFallback) {
        backup = slot.or;
      } else {

        const defaultValue = this.byDefault(slot.context, this);

        backup = defaultValue ? afterThe(...defaultValue) : afterThe();
      }
      if (backup != null) {
        return nextAfterEvent(backup); // Backup value found.
      }

      // Backup value is absent. Construct an error response.
      return nextAfterEvent(afterEventBy<Src[]>(() => {
        throw new ContextKeyError(this);
      }));
    });

    const supply = slot.context.get(ContextSupply, { or: null });

    slot.insert(supply ? value.tillOff(supply) : value);
  }

}
