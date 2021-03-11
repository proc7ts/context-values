import { noop } from '@proc7ts/primitives';
import type { Supply } from '@proc7ts/supply';
import type { ContextValues } from '../context-values';
import type { ContextSeedKey } from '../key';
import { ContextKey__symbol } from '../key';
import { ContextBuilder, ContextBuilder__symbol } from './context-builder';
import { ContextSeeders } from './context-seeders.impl';
import type { ContextSeeds } from './context-seeds';
import { ContextValueSpec, contextValueSpec } from './context-value-spec';
import { newContextValues } from './context-values.impl';

/**
 * A registry of context value providers.
 *
 * @typeParam TCtx - Context type.
 */
export class ContextRegistry<TCtx extends ContextValues = ContextValues> {

  /** @internal */
  private readonly _seeders: ContextSeeders<TCtx>;

  /**
   * Constructs a registry for context value providers.
   *
   * It can be chained with another registry by providing an initially known source of known context values.
   *
   * @param initial - An optional source of initially known context values. This can be either a function, or
   * `ContextValues` instance.
   */
  constructor(initial?: ContextSeeds<TCtx> | ContextValues) {
    this._seeders = new ContextSeeders<TCtx>(
        initial
            ? (typeof initial === 'function' ? initial : (seedKey => initial.get(seedKey)))
            : noop,
    );
  }

  /**
   * Provides context value.
   *
   * @typeParam TSrc - Source value type.
   * @typeParam TDeps - Dependencies tuple type.
   * @param spec - Context value specifier.
   *
   * @returns Provider supply instance that removes just added context value provider once cut off.
   */
  provide<TSrc, TDeps extends any[]>(spec: ContextValueSpec<TCtx, unknown, TSrc, TDeps>): Supply {
    if (isContextBuilder(spec)) {
      return spec[ContextBuilder__symbol](this);
    }

    const { a: { [ContextKey__symbol]: { seedKey } }, by } = contextValueSpec(spec);
    const [seeder] = this._seeders.issuer(seedKey);

    return seeder.provide(by);
  }

  /**
   * Creates a seed for the given key in target context.
   *
   * @param context - Target context.
   * @param key - Context value seed key.
   *
   * @returns New context value seed.
   */
  seed<TSrc, TSeed>(context: TCtx, key: ContextSeedKey<TSrc, TSeed>): TSeed {

    const [, factory] = this._seeders.issuer(key);

    return factory(context);
  }

  /**
   * Builds context seeds provider originated from this registry.
   *
   * @returns Mandatory context seeds provider.
   */
  seeds(): ContextSeeds.Mandatory<TCtx> {
    return (seedKey, context) => this.seed(context, seedKey);
  }

  /**
   * Builds context seeds provider that binds seeds to target `context`.
   *
   * @param context - Target value context.
   *
   * @returns A provider of context value seeds bound to the given `context`.
   */
  seedIn(context: TCtx): ContextSeeds.Headless {
    return this.newValues().get.bind(context);
  }

  /**
   * Creates new context values instance consulting this registry for value providers.
   *
   * @returns New context values instance which methods expect `this` instance to be a context the values provided for.
   */
  newValues(): ContextValues {
    return newContextValues(this, this._seeders);
  }

  /**
   * Appends values provided by another value registry to the ones provided by this one.
   *
   * @param other - Another context value registry or context seeds provider.
   *
   * @return New context value registry which values provided by both registries.
   */
  append(other: ContextRegistry<TCtx> | ContextSeeds<TCtx>): ContextRegistry<TCtx> {

    const otherSeeds: ContextSeeds<TCtx> = typeof other === 'function' ? other : other.seeds();

    return new ContextRegistry(<TSrc, TSeed>(key: ContextSeedKey<TSrc, TSeed>, context: TCtx) => {

      const second = otherSeeds(key, context);
      const [seeder, factory] = this._seeders.issuer(key);
      const first = factory(context);

      return second ? seeder.combine(first, second, context) : first;
    });
  }

}

/**
 * @internal
 */
function isContextBuilder<TCtx extends ContextValues, TValue, TSrc, TDeps extends any[]>(
    spec: ContextValueSpec<TCtx, TValue, TSrc, TDeps>,
): spec is ContextBuilder<TCtx> {
  return typeof (spec as Partial<ContextBuilder<TCtx>>)[ContextBuilder__symbol] === 'function';
}
