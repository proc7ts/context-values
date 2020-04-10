/**
 * @packageDocumentation
 * @module @proc7ts/context-values
 */
import { AIterable } from '@proc7ts/a-iterable';
import { valuesProvider } from '@proc7ts/call-thru';
import { ContextKey, ContextKeyDefault, ContextSeedKey, ContextValueOpts } from './context-key';
import { ContextRef } from './context-ref';
import { ContextValues } from './context-values';
import { SimpleContextKey } from './simple-context-key';

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
    extends SimpleContextKey<readonly Src[], Src>
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
        seedKey?: ContextSeedKey<Src, AIterable<Src>>;
        byDefault?: ContextKeyDefault<readonly Src[], ContextKey<readonly Src[], Src>>;
      } = {},
  ) {
    super(name, seedKey);
    this.byDefault = byDefault;
  }

  grow<Ctx extends ContextValues>(
      opts: ContextValueOpts<Ctx, readonly Src[], Src, AIterable<Src>>,
  ): readonly Src[] | null | undefined {

    const result = Array.from(opts.seed);

    if (result.length) {
      return result;
    }

    return opts.byDefault(() => {

      const defaultSources = this.byDefault(opts.context, this);

      if (defaultSources) {
        return Array.from(defaultSources);
      }

      return;
    });
  }

}

