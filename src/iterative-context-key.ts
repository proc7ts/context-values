/**
 * @packageDocumentation
 * @module @proc7ts/context-values
 */
import { isPresent, lazyValue } from '@proc7ts/primitives';
import { filterIt, itsEmpty, mapIt, overElementsOf, overNone, PushIterable } from '@proc7ts/push-iterator';
import { ContextKey, ContextSeedKey } from './context-key';
import { ContextSeeder } from './context-seeder';
import { ContextValueProvider } from './context-value-spec';
import { ContextValues } from './context-values';

/**
 * @internal
 */
class IterativeContextSeeder<Ctx extends ContextValues, Src> implements ContextSeeder<Ctx, Src, PushIterable<Src>> {

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

  seed(context: Ctx, initial: Iterable<Src> = overNone()): PushIterable<Src> {
    return overElementsOf(
      initial,
      iterativeSeed(context, this._providers),
    );
  }

  isEmpty(seed: Iterable<Src>): boolean {
    return itsEmpty(seed);
  }

  combine(first: Iterable<Src>, second: Iterable<Src>): PushIterable<Src> {
    return overElementsOf(first, second);
  }

}

/**
 * @internal
 */
class IterativeSeedKey<Src> extends ContextSeedKey<Src, PushIterable<Src>> {

  seeder<Ctx extends ContextValues>(): IterativeContextSeeder<Ctx, Src> {
    return new IterativeContextSeeder();
  }

}

/**
 * Iterative context value key implementation.
 *
 * Collects value sources as iterable instance.
 *
 * A context value associated with this key is never changes once constructed.
 *
 * @typeparam Value  Context value type.
 * @typeparam Src  Source value type.
 */
export abstract class IterativeContextKey<Value, Src = Value> extends ContextKey<Value, Src, Iterable<Src>> {

  readonly seedKey: ContextSeedKey<Src, Iterable<Src>>;

  /**
   * Constructs iterative context value key.
   *
   * @param name  Human-readable key name.
   * @param seedKey  Value seed key. A new one will be constructed when omitted.
   */
  constructor(
      name: string,
      {
        seedKey,
      }: {
        seedKey?: ContextSeedKey<Src, Iterable<Src>>;
      } = {},
  ) {
    super(name);
    this.seedKey = seedKey || new IterativeSeedKey(this);
  }

}

/**
 * @internal
 */
function iterativeSeed<Ctx extends ContextValues, Src>(
    context: Ctx,
    providers: readonly ContextValueProvider<Ctx, Src>[],
): PushIterable<Src> {
  return filterIt<Src | null | undefined, Src>(
      mapIt(
          providers.map(provider => lazyValue(provider.bind(undefined, context))), // lazily evaluated providers
          provider => provider(),
      ),
      isPresent,
  );
}
