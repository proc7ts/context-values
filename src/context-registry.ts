/**
 * @packageDocumentation
 * @module @proc7ts/context-values
 */
import { noop } from '@proc7ts/primitives';
import { ContextKey__symbol, ContextSeedKey } from './context-key';
import { ContextSeedRegistry, newContextValues } from './context-seed-registry.impl';
import { ContextSeeds } from './context-seeder';
import { contextValueSpec, ContextValueSpec } from './context-value-spec';
import { ContextValues } from './context-values';

/**
 * A registry of context value providers.
 *
 * @typeparam Ctx  Context type.
 */
export class ContextRegistry<Ctx extends ContextValues = ContextValues> {

  /** @internal */
  private readonly _seeds: ContextSeedRegistry<Ctx>;

  /**
   * Constructs a registry for context value providers.
   *
   * It can be chained with another registry by providing an initially known source of known context values.
   *
   * @param initial  An optional source of initially known context values. This can be either a function, or
   * `ContextValues` instance.
   */
  constructor(initial?: ContextSeeds<Ctx> | ContextValues) {

    let initialSeeds: ContextSeeds<Ctx>;

    if (initial == null) {
      initialSeeds = noop;
    } else if (typeof initial === 'function') {
      initialSeeds = initial;
    } else {
      initialSeeds = seedKey => initial.get(seedKey);
    }

    this._seeds = new ContextSeedRegistry<Ctx>(initialSeeds);
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
    const [seeder] = this._seeds.seedData<Src, Seed>(seedKey);

    return seeder.provide(by);
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

    const [, factory] = this._seeds.seedData(key);

    return factory(context);
  }

  /**
   * Builds context seeds provider that binds seeds to target `context`.
   *
   * @param context  Target value context.
   *
   * @returns A provider of context value seeds bound to the given `context`.
   */
  seedIn(context: Ctx): ContextSeeds.Headless {
    return this.newValues().get.bind(context);
  }

  /**
   * Creates new context values instance consulting this registry for value providers.
   *
   * @returns New context values instance which methods expect `this` instance to be a context the values provided for.
   */
  newValues(): ContextValues {
    return newContextValues(this, this._seeds);
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

      const [seeder, factory] = this._seeds.seedData(key);

      return seeder.combine(factory(context), other.seed(context, key), context);
    });
  }

}

