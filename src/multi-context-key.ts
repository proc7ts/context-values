/**
 * @packageDocumentation
 * @module @proc7ts/context-values
 */
import { valuesProvider } from '@proc7ts/primitives';
import { itsElements } from '@proc7ts/push-iterator';
import { ContextKey, ContextKeyDefault, ContextSeedKey, ContextValueSlot } from './context-key';
import { ContextRef } from './context-ref';
import { IterativeContextKey } from './iterative-context-key';

/**
 * Multiple context value reference.
 *
 * Represents context value as read-only array of source values.
 *
 * @typeparam Src  Value source type and context value item type.
 */
export type MultiContextRef<Src> = ContextRef<readonly Src[], Src>;

/**
 * Multiple context values key.
 *
 * Represents context value as read-only array of source values.
 *
 * Associated with empty array by default.
 *
 * @typeparam Src  Value source type and context value item type.
 */
export class MultiContextKey<Src>
    extends IterativeContextKey<readonly Src[], Src>
    implements MultiContextRef<Src> {

  /**
   * A provider of context value used when there is no value associated with this key.
   */
  readonly byDefault: ContextKeyDefault<readonly Src[], ContextKey<readonly Src[], Src>>;

  /**
   * Constructs multiple context values key.
   *
   * @param name  Human-readable key name.
   * @param seedKey  Value seed key. A new one will be constructed when omitted.
   * @param byDefault  Optional default value provider. If unspecified then the default value is empty array.
   */
  constructor(
      name: string,
      {
        seedKey,
        byDefault = valuesProvider(),
      }: {
        seedKey?: ContextSeedKey<Src, Iterable<Src>>;
        byDefault?: ContextKeyDefault<readonly Src[], ContextKey<readonly Src[], Src>>;
      } = {},
  ) {
    super(name, seedKey);
    this.byDefault = byDefault;
  }

  grow(
      slot: ContextValueSlot<readonly Src[], Src, Iterable<Src>>,
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

