/**
 * @packageDocumentation
 * @module @proc7ts/context-values
 */
import { filterIt, flatMapIt, itsEmpty, mapIt, overArray, overNone } from '@proc7ts/a-iterable';
import { isPresent } from '@proc7ts/call-thru';
import { ContextKey, ContextSeedKey } from './context-key';
import { ContextSeeder } from './context-seeder';
import { ContextValueProvider } from './context-value-spec';
import { ContextValues } from './context-values';

/**
 * @internal
 */
class IterativeContextSeeder<Ctx extends ContextValues, Src> implements ContextSeeder<Ctx, Src, Iterable<Src>> {

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

  seed(context: Ctx, initial: Iterable<Src> = overNone()): Iterable<Src> {
    return flatMapIt([
      initial,
      iterativeSeed(context, this._providers),
    ]);
  }

  isEmpty(seed: Iterable<Src>): boolean {
    return itsEmpty(seed);
  }

  combine(first: Iterable<Src>, second: Iterable<Src>): Iterable<Src> {
    return flatMapIt([first, second]);
  }

}

/**
 * @internal
 */
class IterativeSeedKey<Src> extends ContextSeedKey<Src, Iterable<Src>> {

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
  constructor(name: string, seedKey?: ContextSeedKey<Src, Iterable<Src>>) {
    super(name);
    this.seedKey = seedKey || new IterativeSeedKey(this);
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
function iterativeSeed<Ctx extends ContextValues, Src>(
    context: Ctx,
    providers: readonly ContextValueProvider<Ctx, Src>[],
): Iterable<Src> {
  return filterIt<Src | null | undefined, Src>(
      mapIt<SourceEntry<Ctx, Src>, Src | null | undefined>(
          overArray(providers.map<SourceEntry<Ctx, Src>>(provider => [provider])),
          entry => {
            if (entry.length > 1) {
              return entry[1];
            }

            const source = entry[0](context);

            entry.push(source);

            return source;
          },
      ),
      isPresent,
  );
}
