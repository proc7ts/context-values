/**
 * @module context-values
 */
import { noop } from 'call-thru';
import { ContextKey, ContextSeedKey, ContextValueOpts } from './context-key';
import { ContextRequest } from './context-request';
import { ContextSeeder, ContextSeedProvider } from './context-seeder';
import { contextValueSpec, ContextValueSpec } from './context-value-spec';
import { ContextValues } from './context-values';

type SeedFactory<Ctx extends ContextValues, Seed> = (this: void, context: Ctx) => Seed;

type Seeding<Ctx extends ContextValues, Src, Seed> = [ContextSeeder<Ctx, Src, Seed>, SeedFactory<Ctx, Seed>];

/**
 * A registry of context value providers.
 *
 * @typeparam Ctx  Context type.
 */
export class ContextRegistry<Ctx extends ContextValues = ContextValues> {

  /** @internal */
  private readonly _initial: ContextSeedProvider<Ctx>;

  /** @internal */
  private readonly _seeds = new Map<ContextSeedKey<any, any>, Seeding<Ctx, any, any>>();

  /** @internal */
  private _nonCachedValues?: ContextValues;

  /**
   * Constructs a registry for context value providers.
   *
   * It can be chained with another registry by providing an initially known source of known context values.
   *
   * @param initial  An optional source of initially known context values. This can be either a function, or
   * `ContextValues` instance.
   */
  constructor(initial?: ContextSeedProvider<Ctx> | ContextValues) {
    if (initial == null) {
      this._initial = noop;
    } else if (typeof initial === 'function') {
      this._initial = initial;
    } else {
      this._initial = (_context, seedKey) => initial.get(seedKey);
    }
  }

  /**
   * Provides context value.
   *
   * @typeparam Deps  Dependencies tuple type.
   * @typeparam Src  Source value type.
   * @typeparam Seed  Context value seed type.
   * @param spec  Context value specifier.
   */
  provide<Deps extends any[], Src, Seed>(spec: ContextValueSpec<Ctx, any, Deps, Src>): void {

    const { a: { key: { seedKey } }, by } = contextValueSpec(spec);
    const [seeder] = this._seeding<Src, Seed>(seedKey);

    seeder.provide(by);
  }

  /**
   * @internal
   */
  private _seeding<Src, Seed>(seedKey: ContextSeedKey<Src, Seed>): Seeding<Ctx, Src, Seed> {

    const found: Seeding<Ctx, Src, Seed> | undefined = this._seeds.get(seedKey);

    if (found) {
      return found;
    }

    const seeder: ContextSeeder<Ctx, Src, Seed> = seedKey.seeder();
    const factory: SeedFactory<Ctx, Seed> = context => seeder.seed(context, this._initial(context, seedKey));
    const seeding: Seeding<Ctx, Src, Seed> = [seeder, factory];

    this._seeds.set(seedKey, seeding);

    return seeding;
  }

  /**
   * Creates a seed for the given key in target context.
   *
   * @param context  Target context.
   * @param key  Context value seed key.
   *
   * @returns New context value seed.
   */
  seed<Src, Seed>(context: Ctx, key: ContextSeedKey<Src, Seed>): Seed {

    const [, factory] = this._seeding(key);

    return factory(context);
  }

  /**
   * Binds value sources to the given context.
   *
   * @param context  Target value context.
   * @param cache  Whether to cache context values. When `false` the value providers may be called multiple times.
   *
   * @returns A provider of context value seeds bound to the given `context`.
   */
  bindSources(context: Ctx, cache?: boolean): ContextSeedProvider<Ctx> {

    const values = this.newValues(cache);

    return <Src, Seed>(_context: Ctx, key: ContextSeedKey<Src, Seed>) =>
        values.get.call<Ctx, [ContextSeedKey<Src, Seed>], Seed>(context, key);
  }

  /**
   * Creates new context values instance consulting this registry for value providers.
   *
   * @param cache  Whether to cache context values. When `false` the value providers may be called multiple times.
   *
   * @returns New context values instance which methods expect `this` instance to be a context the values provided for.
   */
  newValues(cache = true): ContextValues & ThisType<Ctx> {
    if (!cache && this._nonCachedValues) {
      return this._nonCachedValues;
    }

    const values = new Map<ContextKey<any>, any>();
    const registry = this;

    class Values extends ContextValues {

      get<V, S>(
          this: Ctx,
          { key }: { key: ContextKey<V, S> },
          opts?: ContextRequest.Opts<V>,
      ): V | null | undefined {

        const context = this;
        const cached: V | undefined = values.get(key);

        if (cached != null) {
          return cached;
        }

        const [constructed, defaultUsed] = growValue(context, key, opts);

        if (cache && !defaultUsed) {
          values.set(key, constructed);
        }

        return constructed;
      }

    }

    if (!cache) {
      return this._nonCachedValues = new Values();
    }

    return new Values();

    function growValue<Value, Src, Seed>(
        context: Ctx,
        key: ContextKey<Value, Src, Seed>,
        opts: ContextRequest.Opts<Value> | undefined,
    ): [Value | null | undefined, boolean] {

      const [seeder, seed] = findSeed<Src, Seed>(context, key);
      let defaultUsed = false;

      const valueOpts: ContextValueOpts<Ctx, Value, Src, Seed> = {
        context,
        seeder,
        seed,
        byDefault: (opts && 'or' in opts)
            ? () => {
              defaultUsed = true;
              return opts.or;
            } : defaultProvider => {

              const defaultValue = defaultProvider();

              if (defaultValue == null) {
                throw new Error(`There is no value with key ${key}`);
              }

              return defaultValue;
            }
      };

      return [
        key.grow(valueOpts),
        defaultUsed,
      ];
    }

    function findSeed<Src, Seed>(
        context: Ctx,
        key: ContextKey<any, Src>,
    ): [ContextSeeder<Ctx, Src, Seed>, Seed] {

      const { seedKey } = key;
      const [seeder, factory] = registry._seeding(seedKey);

      if (seedKey !== key as any) {
        // This is not a seed key
        // Retrieve the seed by seed key
        return [seeder, context.get(seedKey)];
      }

      return [seeder, factory(context)];
    }
  }

  /**
   * Appends values provided by another value registry to the ones provided by this one.
   *
   * @param other  Another context value registry.
   *
   * @return New context value registry which values provided by both registries.
   */
  append(other: ContextRegistry<Ctx>): ContextRegistry<Ctx> {

    const self = this;

    return new ContextRegistry<Ctx>(combine);

    function combine<Src, Seed>(context: Ctx, key: ContextSeedKey<Src, Seed>): Seed {

      const [seeder] = self._seeding(key);

      return seeder.combine(context, self.seed(context, key), other.seed(context, key));
    }
  }

}
