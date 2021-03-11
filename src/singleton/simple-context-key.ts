import { lazyValue, noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import type { ContextValues } from '../context-values';
import type { ContextSeeder } from '../key';
import { ContextKey, ContextSeedKey } from '../key';
import type { ContextValueProvider } from '../registry';

/**
 * @internal
 */
class SimpleContextSeeder<TCtx extends ContextValues, TSrc>
    implements ContextSeeder<TCtx, TSrc, SimpleContextKey.Seed<TSrc>> {

  private readonly _providers: (readonly [ContextValueProvider<TSrc, TCtx>])[] = [];

  provide(provider: ContextValueProvider<TSrc, TCtx>): Supply {

    // Ensure the same provider may be registered multiple times
    const entry: readonly [ContextValueProvider<TSrc, TCtx>] = [provider];

    this._providers.unshift(entry);

    return new Supply(() => this._providers.splice(this._providers.lastIndexOf(entry), 1));
  }

  seed(context: TCtx, initial?: SimpleContextKey.Seed<TSrc>): SimpleContextKey.Seed<TSrc> {

    const { length } = this._providers;

    if (!length) {
      return initial || noop;
    }

    const makeSeed = (
        [provider]: readonly [ContextValueProvider<TSrc, TCtx>],
    ): SimpleContextKey.Seed<TSrc> => lazyValue(
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
 * @typeParam TValue - Context value type.
 * @typeParam TSrc - Source value type.
 */
export abstract class SimpleContextKey<TValue, TSrc = TValue>
    extends ContextKey<TValue, TSrc, SimpleContextKey.Seed<TSrc>> {

  readonly seedKey: ContextSeedKey<TSrc, SimpleContextKey.Seed<TSrc>>;

  /**
   * Constructs simple context value key.
   *
   * @param name - Human-readable key name.
   * @param seedKey - Value seed key. A new one will be constructed when omitted.
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
   * @typeParam TSrc - Source vale type.
   */
  export type Seed<TSrc> =
  /**
   * @returns Either source value, or `null`/`undefined` when absent.
   */
      (this: void) => TSrc | null | undefined;

}
