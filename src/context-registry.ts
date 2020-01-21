/**
 * @module context-values
 */
import { noop } from 'call-thru';
import { ContextKey, ContextKey__symbol, ContextSeedKey, ContextValueOpts } from './context-key';
import { ContextKeyError } from './context-key-error';
import { ContextRef, ContextRequest } from './context-ref';
import { ContextSeeder, ContextSeeds } from './context-seeder';
import { contextValueSpec, ContextValueSpec } from './context-value-spec';
import { ContextValues } from './context-values';

/**
 * @internal
 */
type SeedFactory<Ctx extends ContextValues, Seed> = (this: void, context: Ctx) => Seed;

/**
 * @internal
 */
type Seeding<Ctx extends ContextValues, Src, Seed> = [ContextSeeder<Ctx, Src, Seed>, SeedFactory<Ctx, Seed>];

/**
 * A registry of context value providers.
 *
 * @typeparam Ctx  Context type.
 */
export class ContextRegistry<Ctx extends ContextValues = ContextValues> {

  /** @internal */
  private readonly _initial: ContextSeeds<Ctx>;

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
  constructor(initial?: ContextSeeds<Ctx> | ContextValues) {
    if (initial == null) {
      this._initial = noop;
    } else if (typeof initial === 'function') {
      this._initial = initial;
    } else {
      this._initial = seedKey => initial.get(seedKey);
    }
  }

  /**
   * Provides context value.
   *
   * @typeparam Deps  Dependencies tuple type.
   * @typeparam Src  Source value type.
   * @typeparam Seed  Value seed type.
   * @param spec  Context value specifier.
   *
   * @returns A function that removes the given context value specifier when called.
   */
  provide<Deps extends any[], Src, Seed>(spec: ContextValueSpec<Ctx, any, Deps, Src, Seed>): () => void {

    const { a: { [ContextKey__symbol]: { seedKey } }, by } = contextValueSpec(spec);
    const [seeder] = this._seeding<Src, Seed>(seedKey);

    return seeder.provide(by);
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
    const factory: SeedFactory<Ctx, Seed> = context => seeder.seed(context, this._initial(seedKey, context));
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
   * Builds context seeds provider that binds seeds to target `context`.
   *
   * @param context  Target value context.
   * @param cache  Whether to cache context values. When `false` the value providers may be called multiple times.
   *
   * @returns A provider of context value seeds bound to the given `context`.
   */
  seedIn(context: Ctx, cache?: boolean): <Src, Seed>(this: void, key: ContextSeedKey<Src, Seed>) => Seed | undefined {
    return this.newValues(cache).get.bind(context);
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

      get<Value, Src>(
          this: Ctx,
          { [ContextKey__symbol]: key }: ContextRef<Value, Src>,
          opts?: ContextRequest.Opts<Value>,
      ): Value | null | undefined {

        const context = this;
        const cached: Value | undefined = values.get(key);

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

      const valueOpts: {
        -readonly [K in keyof ContextValueOpts<Ctx, Value, Src, Seed>]: ContextValueOpts<Ctx, Value, Src, Seed>[K];
      } = {
        context,
        seeder,
        seed,
        byDefault: (opts && 'or' in opts)
            ? () => {
              defaultUsed = true;
              return opts.or;
            }
            : defaultProvider => {

              const defaultValue = defaultProvider();

              if (defaultValue == null) {
                throw new ContextKeyError(key);
              }

              return defaultValue;
            },
      };

      if (opts && 'or' in opts) {
        valueOpts.or = opts.or;
      }

      return [
        key.grow(valueOpts),
        defaultUsed,
      ];
    }

    function findSeed<Src, Seed>(
        context: Ctx,
        key: ContextKey<any, Src, Seed>,
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
    return new ContextRegistry(<Src, Seed>(key: ContextSeedKey<Src, Seed>, context: Ctx) => {

      const [seeder, factory] = this._seeding(key);

      return seeder.combine(factory(context), other.seed(context, key), context);
    });
  }

}
