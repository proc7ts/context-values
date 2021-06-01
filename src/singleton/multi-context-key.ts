import { valuesProvider } from '@proc7ts/primitives';
import { itsElements } from '@proc7ts/push-iterator';
import type { ContextRef } from '../context-ref';
import type { ContextKey, ContextKeyDefault, ContextSeedKey, ContextValueSlot } from '../key';
import { IterativeContextKey } from './iterative-context-key';

/**
 * Multiple context value reference.
 *
 * Represents context value as read-only array of source values.
 *
 * @typeParam TSrc - TValue source type and context value item type.
 */
export type MultiContextRef<TSrc> = ContextRef<readonly TSrc[], TSrc>;

/**
 * Multiple context values key.
 *
 * Represents context value as read-only array of source values.
 *
 * Associated with empty array by default.
 *
 * @typeParam TSrc - TValue source type and context value item type.
 */
export class MultiContextKey<TSrc>
    extends IterativeContextKey<readonly TSrc[], TSrc>
    implements MultiContextRef<TSrc> {

  /**
   * A provider of context value used when there is no value associated with this key.
   */
  readonly byDefault: ContextKeyDefault<readonly TSrc[], ContextKey<readonly TSrc[], TSrc>>;

  /**
   * Constructs multiple context values key.
   *
   * @param name - Human-readable key name.
   * @param seedKey - Value seed key. A new one will be constructed when omitted.
   * @param byDefault - Optional default value provider. If unspecified then the default value is empty array.
   */
  constructor(
      name: string,
      {
        seedKey,
        byDefault = valuesProvider(),
      }: {
        seedKey?: ContextSeedKey<TSrc, Iterable<TSrc>>;
        byDefault?: ContextKeyDefault<readonly TSrc[], ContextKey<readonly TSrc[], TSrc>>;
      } = {},
  ) {
    super(name, seedKey);
    this.byDefault = byDefault;
  }

  grow(
      slot: ContextValueSlot<readonly TSrc[], TSrc, Iterable<TSrc>>,
  ): void {

    const result = itsElements(slot.seed);

    if (result.length) {
      slot.insert(result);
    } else if (!slot.hasFallback) {

      const defaultSources = this.byDefault(slot.context, this);

      if (defaultSources) {
        slot.insert(Array.from(defaultSources));
      }
    }
  }

}
