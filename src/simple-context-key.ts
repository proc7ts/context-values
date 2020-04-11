/**
 * @packageDocumentation
 * @module @proc7ts/context-values
 */
import { noop, valueProvider } from '@proc7ts/call-thru';
import { ContextKey, ContextSeedKey } from './context-key';
import { ContextSeeder } from './context-seeder';
import { ContextValueProvider } from './context-value-spec';
import { ContextValues } from './context-values';

/**
 * @internal
 */
class SimpleContextSeeder<Ctx extends ContextValues, Src>
    implements ContextSeeder<Ctx, Src, SimpleContextKey.Seed<Src>> {

  private readonly _providers: ContextValueProvider<Ctx, Src>[] = [];

  provide(provider: ContextValueProvider<Ctx, Src>): () => void {
    this._providers.unshift(provider);
    return () => {

      const found = this._providers.lastIndexOf(provider);

      if (found >= 0) {
        this._providers.splice(found, 1);
      }
    };
  }

  seed(context: Ctx, initial: SimpleContextKey.Seed<Src>): SimpleContextKey.Seed<Src> {

    let seeds = this._providers.map(provider => simpleSeedByProvider(context, provider));

    if (initial) {
      if (!this._providers.length) {
        return initial;
      }
      seeds = [...seeds, initial];
    } else if (seeds.length < 2) {
      return seeds.length ? seeds[0] : noop;
    }

    return combineSimpleSeeds(seeds);
  }

  isEmpty(seed: SimpleContextKey.Seed<Src>): boolean {
    return seed() == null;
  }

  combine(
      first: SimpleContextKey.Seed<Src>,
      second: SimpleContextKey.Seed<Src>,
  ): SimpleContextKey.Seed<Src> {
    if (first === noop) {
      return second;
    }
    if (second === noop) {
      return first;
    }
    return combineSimpleSeeds([second, first]);
  }


}

/**
 * @internal
 */
function simpleSeedByProvider<Ctx extends ContextValues, Src>(
    context: Ctx,
    provider: ContextValueProvider<Ctx, Src>,
): SimpleContextKey.Seed<Src> {

  let get = (): Src | null | undefined => {
    get = valueProvider(provider(context));
    return get();
  };

  return () => get();
}

/**
 * @internal
 */
function combineSimpleSeeds<Src>(
    seeds: readonly SimpleContextKey.Seed<Src>[],
): SimpleContextKey.Seed<Src> {
  return () => {
    for (const seed of seeds) {

      const value = seed();

      if (value != null) {
        return value;
      }
    }
    return;
  };
}

/**
 * @internal
 */
class SimpleSeedKey<Src> extends ContextSeedKey<Src, SimpleContextKey.Seed<Src>> {

  seeder<Ctx extends ContextValues>(): SimpleContextSeeder<Ctx, Src> {
    return new SimpleContextSeeder();
  }

}

/**
 * Simple context value key implementation.
 *
 * Collects the most recent source value.
 *
 * A context value associated with this key is never changes once constructed.
 *
 * @typeparam Value  Context value type.
 * @typeparam Src  Source value type.
 */
export abstract class SimpleContextKey<Value, Src = Value> extends ContextKey<Value, Src, SimpleContextKey.Seed<Src>> {

  readonly seedKey: ContextSeedKey<Src, SimpleContextKey.Seed<Src>>;

  /**
   * Constructs simple context value key.
   *
   * @param name  Human-readable key name.
   * @param seedKey  Value seed key. A new one will be constructed when omitted.
   */
  constructor(name: string, seedKey?: ContextSeedKey<Src, SimpleContextKey.Seed<Src>>) {
    super(name);
    this.seedKey = seedKey || new SimpleSeedKey(this);
  }

}

export namespace SimpleContextKey {

  /**
   * A seed of {@link SimpleContextKey simple context key}.
   *
   * @typeparam Src  Source vale type.
   */
  export type Seed<Src> =
  /**
   * @returns Either source value, or `null`/`undefined` when when absent.
   */
      (this: void) => Src | null | undefined;

}
