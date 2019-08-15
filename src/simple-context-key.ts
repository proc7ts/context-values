/**
 * @module context-values
 */
import { AIterable, itsEmpty, itsIterator, itsLast, overArray, overNone } from 'a-iterable';
import { asis, isPresent } from 'call-thru';
import { ContextKey, ContextSeedKey, DefaultContextValueHandler } from './context-key';
import { ContextSeed, ContextSeeder } from './context-seed';
import { ContextValueProvider } from './context-value-spec';
import { ContextValues } from './context-values';

export interface IterableContextSeed<Src> extends AIterable<Src>, ContextSeed {
}

class SimpleContextSeed<Ctx extends ContextValues, Src> extends AIterable<Src> implements IterableContextSeed<Src> {

  constructor(private readonly _sources: AIterable<Src>) {
    super();
  }

  get empty(): boolean {
    return itsEmpty(this._sources);
  }

  [Symbol.iterator](): Iterator<Src> {
    return itsIterator(this._sources);
  }

  reverse(): AIterable<Src> {
    return this._sources.reverse();
  }

}

class SimpleContextSeeder<Ctx extends ContextValues, Src>
    implements ContextSeeder<Ctx, Src, IterableContextSeed<Src>> {

  private readonly _providers: SourceEntry<Ctx, Src>[] = [];

  provide(provider: ContextValueProvider<Ctx, Src>): void {
    this._providers.push([provider]);
  }

  seed(context: Ctx, initial?: IterableContextSeed<Src>): IterableContextSeed<Src> {
    return new SimpleContextSeed(
        AIterable.from([
          initial || AIterable.from<Src>(overNone()),
          sourceValues(
              context,
              AIterable.from(overArray(this._providers)),
          ),
        ]).flatMap(asis),
    );
  }

  combine(context: Ctx, first: IterableContextSeed<Src>, second: IterableContextSeed<Src>): IterableContextSeed<Src> {
    return new SimpleContextSeed(AIterable.from([first, second]).flatMap(asis));
  }

}

class SimpleSeedKey<Src> extends ContextSeedKey<Src, IterableContextSeed<Src>> {

  constructor(key: ContextKey<any, Src>) {
    super(key);
  }

  seeder<Ctx extends ContextValues>(): SimpleContextSeeder<Ctx, Src> {
    return new SimpleContextSeeder();
  }

}

/**
 * Simple context value key implementation.
 *
 * Collects value sources into {@link IterableContextSeed iterable instance}.
 *
 * A context value associated with this key is never changes once constructed.
 *
 * @typeparam Value  Context value type.
 * @typeparam Src  Source value type.
 * @typeparam Seed  Value seed type.
 */
export abstract class SimpleContextKey<Value, Src = Value>
    extends ContextKey<Value, Src, IterableContextSeed<Src>> {

  readonly seedKey: ContextSeedKey<Src, IterableContextSeed<Src>>;

  /**
   * Constructs context value key.
   *
   * @param name  Human-readable key name.
   */
  protected constructor(name: string) {
    super(name);
    this.seedKey = new SimpleSeedKey(this);
  }

}

/**
 * Single context value key.
 *
 * Treats the last source value as context one and ignores the rest of them.
 *
 * @typeparam Value  Context value type.
 */
export class SingleContextKey<Value> extends SimpleContextKey<Value> {

  /**
   * A provider of context value used when there is no value associated with this key.
   *
   * If `undefined`, then there is no default value.
   */
  readonly defaultProvider: (context: ContextValues) => Value | null | undefined;

  /**
   * Constructs single context value key.
   *
   * @param name  Human-readable key name.
   * @param defaultProvider  Optional default value provider. If unspecified or `undefined` the key has no default
   * value.
   */
  constructor(name: string, defaultProvider: (context: ContextValues) => Value | null | undefined = () => undefined) {
    super(name);
    this.defaultProvider = defaultProvider;
  }

  grow(
      context: ContextValues,
      seed: IterableContextSeed<Value>,
      handleDefault: DefaultContextValueHandler<Value>,
  ): Value | null | undefined {

    const value = itsLast(seed);

    if (value != null) {
      return value;
    }

    return handleDefault(() => this.defaultProvider(context));
  }

}

/**
 * Multiple context values key.
 *
 * Represents context value as array of source values.
 *
 * Associated with empty array by default.
 *
 * @typeparam Src  Value source type and context value item type.
 */
export class MultiContextKey<Src> extends SimpleContextKey<Src[], Src> {

  /**
   * A provider of context value used when there is no value associated with this key.
   */
  readonly defaultProvider: ContextValueProvider<ContextValues, Src[]>;

  /**
   * Constructs multiple context values key.
   *
   * @param name  Human-readable key name.
   * @param defaultProvider  Optional default value provider. If unspecified then the default value is empty array.
   */
  constructor(name: string, defaultProvider: ContextValueProvider<ContextValues, Src[]> = () => []) {
    super(name);
    this.defaultProvider = defaultProvider;
  }

  grow(
      context: ContextValues,
      seed: IterableContextSeed<Src>,
      handleDefault: DefaultContextValueHandler<Src[]>,
  ): Src[] | null | undefined {

    const result = [...seed];

    if (result.length) {
      return result;
    }

    return handleDefault(() => {

      const defaultSources = this.defaultProvider(context);

      if (defaultSources) {
        return [...defaultSources];
      }

      return;
    });
  }

}

// Context value provider and cached context value source.
type SourceEntry<Ctx extends ContextValues, Src> = [ContextValueProvider<Ctx, Src>, (Src | null | undefined)?];

function sourceValues<Ctx extends ContextValues, Src>(
    context: Ctx,
    sourceEntries: AIterable<SourceEntry<Ctx, Src>>,
): AIterable<Src> {
  return sourceEntries.map(sourceProvider => {
    if (sourceProvider.length > 1) {
      return sourceProvider[1];
    }

    const source = sourceProvider[0](context);

    sourceProvider.push(source);

    return source;
  }).filter<Src>(isPresent);
}
