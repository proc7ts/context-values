/**
 * @packageDocumentation
 * @module @proc7ts/context-values
 */
import { lazyValue, Supply } from '@proc7ts/primitives';
import {
  itsElements,
  itsEmpty,
  overElementsOf,
  overIterator,
  overNone,
  PushIterable,
  valueIt,
} from '@proc7ts/push-iterator';
import { ContextKey, ContextSeedKey } from './context-key';
import type { ContextSeeder } from './context-seeder';
import type { ContextValueProvider } from './context-value-spec';
import type { ContextValues } from './context-values';

/**
 * @internal
 */
class IterativeContextSeeder<TCtx extends ContextValues, TSrc>
    implements ContextSeeder<TCtx, TSrc, PushIterable<TSrc>> {

  private readonly _providers = new Map<Supply, ContextValueProvider<TCtx, TSrc>>();

  provide(provider: ContextValueProvider<TCtx, TSrc>): Supply {

    const supply = new Supply();

    this._providers.set(supply, provider);

    return supply.whenOff(() => this._providers.delete(supply));
  }

  seed(context: TCtx, initial: Iterable<TSrc> = overNone()): PushIterable<TSrc> {
    return overElementsOf(
        initial,
        iterativeSeed(context, this._providers),
    );
  }

  isEmpty(seed: Iterable<TSrc>): boolean {
    return itsEmpty(seed);
  }

  combine(first: Iterable<TSrc>, second: Iterable<TSrc>): PushIterable<TSrc> {
    return overElementsOf(first, second);
  }

}

/**
 * @internal
 */
class IterativeSeedKey<TSrc> extends ContextSeedKey<TSrc, PushIterable<TSrc>> {

  seeder<TCtx extends ContextValues>(): IterativeContextSeeder<TCtx, TSrc> {
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
 * @typeParam TValue  Context value type.
 * @typeParam TSrc  Source value type.
 */
export abstract class IterativeContextKey<TValue, TSrc = TValue> extends ContextKey<TValue, TSrc, Iterable<TSrc>> {

  readonly seedKey: ContextSeedKey<TSrc, Iterable<TSrc>>;

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
        seedKey?: ContextSeedKey<TSrc, Iterable<TSrc>>;
      } = {},
  ) {
    super(name);
    this.seedKey = seedKey || new IterativeSeedKey(this);
  }

}

/**
 * @internal
 */
function iterativeSeed<TCtx extends ContextValues, TSrc>(
    context: TCtx,
    providers: Map<Supply, ContextValueProvider<TCtx, TSrc>>,
): PushIterable<TSrc> {

  // Lazily evaluated providers
  const lazyProviders = itsElements(
      overIterator(() => providers.values()),
      provider => lazyValue(provider.bind(undefined, context)),
  );

  return valueIt(lazyProviders, provider => provider());
}
