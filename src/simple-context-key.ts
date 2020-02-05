/**
 * @packageDocumentation
 * @module context-values
 */
import { AIterable, itsEmpty, itsLast, overArray, overNone } from 'a-iterable';
import { asis, isPresent, noop, valuesProvider } from 'call-thru';
import { ContextKey, ContextKeyDefault, ContextSeedKey, ContextValueOpts } from './context-key';
import { ContextRef } from './context-ref';
import { ContextSeeder } from './context-seeder';
import { ContextValueProvider } from './context-value-spec';
import { ContextValues } from './context-values';

class SimpleContextSeeder<Ctx extends ContextValues, Src> implements ContextSeeder<Ctx, Src, AIterable<Src>> {

  private readonly _providers: ContextValueProvider<Ctx, Src>[] = [];

  provide(provider: ContextValueProvider<Ctx, Src>): () => void {
    this._providers.push(provider);
    return () => {

      const found = this._providers.indexOf(provider);

      if (found >= 0) {
        this._providers.splice(found, 1);
      }
    };
  }

  seed(context: Ctx, initial: AIterable<Src> = AIterable.from(overNone())): AIterable<Src> {
    return AIterable.from([
      initial,
      sourceValues(context, this._providers),
    ]).flatMap(asis);
  }

  isEmpty(seed: AIterable<Src>): boolean {
    return itsEmpty(seed);
  }

  combine(first: AIterable<Src>, second: AIterable<Src>): AIterable<Src> {
    return AIterable.from([first, second]).flatMap(asis);
  }

}

class SimpleSeedKey<Src> extends ContextSeedKey<Src, AIterable<Src>> {

  seeder<Ctx extends ContextValues>(): SimpleContextSeeder<Ctx, Src> {
    return new SimpleContextSeeder();
  }

}

/**
 * Simple context value key implementation.
 *
 * Collects value sources into iterable instance.
 *
 * A context value associated with this key is never changes once constructed.
 *
 * @typeparam Value  Context value type.
 * @typeparam Src  Source value type.
 */
export abstract class SimpleContextKey<Value, Src = Value> extends ContextKey<Value, Src, AIterable<Src>> {

  readonly seedKey: ContextSeedKey<Src, AIterable<Src>>;

  /**
   * Constructs simple context value key.
   *
   * @param name  Human-readable key name.
   * @param seedKey  Value seed key. A new one will be constructed when omitted.
   */
  constructor(name: string, seedKey?: ContextSeedKey<Src, AIterable<Src>>) {
    super(name);
    this.seedKey = seedKey || new SimpleSeedKey(this);
  }

}

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
        seedKey?: ContextSeedKey<Value, AIterable<Value>>;
        byDefault?: ContextKeyDefault<Value, ContextKey<Value>>;
      } = {},
  ) {
    super(name, seedKey);
    this.byDefault = byDefault;
  }

  grow<Ctx extends ContextValues>(
      opts: ContextValueOpts<Ctx, Value, Value, AIterable<Value>>,
  ): Value | null | undefined {

    const value = itsLast(opts.seed);

    if (value != null) {
      return value;
    }

    return opts.byDefault(() => this.byDefault(opts.context, this));
  }

}

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

/**
 * Context value provider and cached context value source.
 *
 * @internal
 */
type SourceEntry<Ctx extends ContextValues, Src> = [ContextValueProvider<Ctx, Src>, (Src | null | undefined)?];

/**
 * @internal
 */
function sourceValues<Ctx extends ContextValues, Src>(
    context: Ctx,
    providers: ContextValueProvider<Ctx, Src>[],
): AIterable<Src> {
  return AIterable.from(overArray(providers.map<SourceEntry<Ctx, Src>>(provider => [provider])))
      .map(entry => {
        if (entry.length > 1) {
          return entry[1];
        }

        const source = entry[0](context);

        entry.push(source);

        return source;
      })
      .filter<Src>(isPresent);
}