/**
 * @packageDocumentation
 * @module @proc7ts/context-values
 */
import { lazyValue, noop } from '@proc7ts/primitives';
import { ContextKey, ContextSeedKey } from './context-key';
import { ContextSeeder } from './context-seeder';
import { ContextValueProvider } from './context-value-spec';
import { ContextValues } from './context-values';

/**
 * @internal
 */
class SimpleContextSeeder<TCtx extends ContextValues, TSrc>
    implements ContextSeeder<TCtx, TSrc, SimpleContextKey.Seed<TSrc>> {

  private readonly _providers: ContextValueProvider<TCtx, TSrc>[] = [];

  provide(provider: ContextValueProvider<TCtx, TSrc>): () => void {
    this._providers.unshift(provider);
    return () => {

      const found = this._providers.lastIndexOf(provider);

      if (found >= 0) {
        this._providers.splice(found, 1);
      }
    };
  }

  seed(context: TCtx, initial?: SimpleContextKey.Seed<TSrc>): SimpleContextKey.Seed<TSrc> {

    const { length } = this._providers;

    if (!length) {
      return initial || noop;
    }

    const makeSeed = (provider: ContextValueProvider<TCtx, TSrc>): SimpleContextKey.Seed<TSrc> => lazyValue(
        provider.bind(undefined, context),
    );

    if (!initial && length === 1) {
      return makeSeed(this._providers[0]);
    }

    const seeds: SimpleContextKey.Seed<TSrc>[] = this._providers.map(makeSeed);

    if (initial) {
      seeds.push(initial);
    }

    return combineSimpleSeeds(seeds);
  }

  isEmpty(seed: SimpleContextKey.Seed<TSrc>): boolean {
    return seed() == null;
  }

  combine(
      first: SimpleContextKey.Seed<TSrc>,
      second: SimpleContextKey.Seed<TSrc>,
  ): SimpleContextKey.Seed<TSrc> {
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
function combineSimpleSeeds<TSrc>(
    seeds: readonly SimpleContextKey.Seed<TSrc>[],
): SimpleContextKey.Seed<TSrc> {
  return lazyValue(() => {
    for (const seed of seeds) {

      const value = seed();

      if (value != null) {
        return value;
      }
    }
    return;
  });
}

/**
 * @internal
 */
class SimpleSeedKey<TSrc> extends ContextSeedKey<TSrc, SimpleContextKey.Seed<TSrc>> {

  seeder<TCtx extends ContextValues>(): SimpleContextSeeder<TCtx, TSrc> {
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
 * @typeParam TValue  Context value type.
 * @typeParam TSrc  Source value type.
 */
export abstract class SimpleContextKey<TValue, TSrc = TValue>
    extends ContextKey<TValue, TSrc, SimpleContextKey.Seed<TSrc>> {

  readonly seedKey: ContextSeedKey<TSrc, SimpleContextKey.Seed<TSrc>>;

  /**
   * Constructs simple context value key.
   *
   * @param name  Human-readable key name.
   * @param seedKey  Value seed key. A new one will be constructed when omitted.
   */
  constructor(
      name: string,
      {
        seedKey,
      }: {
        seedKey?: ContextSeedKey<TSrc, SimpleContextKey.Seed<TSrc>>;
      } = {},
  ) {
    super(name);
    this.seedKey = seedKey || new SimpleSeedKey(this);
  }

}

export namespace SimpleContextKey {

  /**
   * A seed of {@link SimpleContextKey simple context key}.
   *
   * @typeParam TSrc  Source vale type.
   */
  export type Seed<TSrc> =
  /**
   * @returns Either source value, or `null`/`undefined` when when absent.
   */
      (this: void) => TSrc | null | undefined;

}
