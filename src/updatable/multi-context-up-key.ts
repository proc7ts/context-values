import { AfterEvent, afterEventBy, afterThe, digAfter, EventKeeper, supplyAfter } from '@proc7ts/fun-events';
import { noop } from '@proc7ts/primitives';
import type { ContextKeyDefault, ContextValueSlot } from '../context-key';
import { ContextKeyError } from '../context-key-error';
import { ContextSupply } from '../context-supply';
import { ContextUpKey, ContextUpRef } from './context-up-key';

/**
 * Multiple updatable context values reference.
 *
 * @typeParam TSrc - Source value type.
 */
export type MultiContextUpRef<TSrc> = ContextUpRef<AfterEvent<TSrc[]>, TSrc>;

/**
 * Multiple updatable context values key.
 *
 * The associated value is an `AfterEvent` keeper of the source values. It is always present, even though
 * the array can be empty.
 *
 * It is an error to provide a `null` or `undefined` {@link ContextRequest.Opts.or fallback value} when requesting
 * an associated value. Use an `afterThe()` result as a fallback instead.
 *
 * @typeParam TSrc - Source value type.
 */
export class MultiContextUpKey<TSrc>
    extends ContextUpKey<AfterEvent<TSrc[]>, TSrc>
    implements MultiContextUpRef<TSrc> {

  /**
   * A provider of context value used when there is no value associated with this key.
   */
  readonly byDefault: ContextKeyDefault<readonly TSrc[], ContextUpKey<AfterEvent<TSrc[]>, TSrc>>;

  get upKey(): this {
    return this;
  }

  /**
   * Constructs multiple updatable context value key.
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
        seedKey?: ContextUpKey.SeedKey<TSrc>;
        byDefault?: ContextKeyDefault<readonly TSrc[], ContextUpKey<AfterEvent<TSrc[]>, TSrc>>;
      } = {},
  ) {
    super(name, seedKey);
    this.byDefault = byDefault;
  }

  grow(
      slot: ContextValueSlot<AfterEvent<TSrc[]>, EventKeeper<TSrc[]> | TSrc, AfterEvent<TSrc[]>>,
  ): void {

    const value = slot.seed.do(digAfter((...sources: TSrc[]): AfterEvent<TSrc[]> => {
      if (sources.length) {
        // Sources present. Use them.
        return afterThe(...sources);
      }

      // Sources absent. Attempt to detect the backup value.
      let backup: AfterEvent<TSrc[]> | null | undefined;

      if (slot.hasFallback) {
        backup = slot.or;
      } else {

        const defaultValue = this.byDefault(slot.context, this);

        backup = defaultValue ? afterThe(...defaultValue) : afterThe();
      }
      if (backup != null) {
        return backup; // Backup value found.
      }

      // Backup value is absent. Construct an error response.
      return afterEventBy<TSrc[]>(({ supply }) => {
        supply.off(new ContextKeyError(this));
      });
    }));

    slot.insert(value.do<AfterEvent<TSrc[]>>(
        supplyAfter(slot.context.get(ContextSupply)),
    ));
  }

}
