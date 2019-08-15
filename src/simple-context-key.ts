/**
 * @module context-values
 */
import { AIterable, itsEmpty, itsLast, overArray, overNone } from 'a-iterable';
import { asis, isPresent, noop, valuesProvider } from 'call-thru';
import { ContextKey, ContextSeedKey, ContextValueOpts } from './context-key';
import { ContextSeeder } from './context-seeder';
import { ContextValueProvider } from './context-value-spec';
import { ContextValues } from './context-values';

class SimpleContextSeeder<Ctx extends ContextValues, Src> implements ContextSeeder<Ctx, Src, AIterable<Src>> {

  private readonly _providers: SourceEntry<Ctx, Src>[] = [];

  provide(provider: ContextValueProvider<Ctx, Src>): void {
    this._providers.push([provider]);
  }

  seed(context: Ctx, initial?: AIterable<Src>): AIterable<Src> {
    return AIterable.from([
      initial || AIterable.from<Src>(overNone()),
      sourceValues(
          context,
          AIterable.from(overArray(this._providers)),
      ),
    ]).flatMap(asis);
  }

  isEmpty(seed: AIterable<Src>): boolean {
    return itsEmpty(seed);
  }

  combine(_context: Ctx, first: AIterable<Src>, second: AIterable<Src>): AIterable<Src> {
    return AIterable.from([first, second]).flatMap(asis);
  }

}

class SimpleSeedKey<Src> extends ContextSeedKey<Src, AIterable<Src>> {

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
 * Collects value sources into iterable instance.
 *
 * A context value associated with this key is never changes once constructed.
 *
 * @typeparam Value  Context value type.
 * @typeparam Src  Source value type.
 * @typeparam Seed  Value seed type.
 */
export abstract class SimpleContextKey<Value, Src = Value>
    extends ContextKey<Value, Src, AIterable<Src>> {

  readonly seedKey: ContextSeedKey<Src, AIterable<Src>>;

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
  readonly byDefault: (context: ContextValues) => Value | null | undefined;

  /**
   * Constructs single context value key.
   *
   * @param name  Human-readable key name.
   * @param byDefault  Optional default value provider. If unspecified or `undefined` the key has no default
   * value.
   */
  constructor(name: string, byDefault: (context: ContextValues) => Value | null | undefined = noop) {
    super(name);
    this.byDefault = byDefault;
  }

  grow<Ctx extends ContextValues>(
      opts: ContextValueOpts<Ctx, Value, Value, AIterable<Value>>,
  ): Value | null | undefined {

    const value = itsLast(opts.seed);

    if (value != null) {
      return value;
    }

    return opts.byDefault(() => this.byDefault(opts.context));
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
  readonly byDefault: ContextValueProvider<ContextValues, Src[]>;

  /**
   * Constructs multiple context values key.
   *
   * @param name  Human-readable key name.
   * @param byDefault  Optional default value provider. If unspecified then the default value is empty array.
   */
  constructor(name: string, byDefault: ContextValueProvider<ContextValues, Src[]> = valuesProvider()) {
    super(name);
    this.byDefault = byDefault;
  }

  grow<Ctx extends ContextValues>(
      opts: ContextValueOpts<Ctx, Src[], Src, AIterable<Src>>,
  ): Src[] | null | undefined {

    const result = [...opts.seed];

    if (result.length) {
      return result;
    }

    return opts.byDefault(() => {

      const defaultSources = this.byDefault(opts.context);

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
