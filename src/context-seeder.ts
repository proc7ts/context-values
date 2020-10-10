/**
 * @packageDocumentation
 * @module @proc7ts/context-values
 */
import { ContextSeedKey } from './context-key';
import { ContextValueProvider } from './context-value-spec';
import { ContextValues } from './context-values';

/**
 * Context value seeder.
 *
 * Contains context value providers for particular key.
 *
 * Created by [[ContextSeedKey.seeder]] method.
 *
 * @typeParam TCtx  Context type.
 * @typeParam TSrc  Source value type.
 * @typeParam TSeed  Context value seed type.
 * @typeParam Self  This type.
 */
export interface ContextSeeder<TCtx extends ContextValues, TSrc, TSeed> {

  /**
   * Provides context value.
   *
   * @param provider  Context value provider.
   *
   * @returns A function that removes the given context value `provider` when called.
   */
  provide(provider: ContextValueProvider<TCtx, TSrc>): () => void;

  /**
   * Creates context value seed for target `context`.
   *
   * @param context  Target context.
   * @param initial  Initial seed the constructed one should derive values from.
   *
   * @returns New context value seed.
   */
  seed(context: TCtx, initial?: TSeed): TSeed;

  /**
   * Checks whether the given context value `seed` is empty.
   *
   * @param seed  Context value seed to check.
   *
   * @returns `true` is the given seed does not contain any source values, or `false` otherwise.
   */
  isEmpty(seed: TSeed): boolean;

  /**
   * Combines two seeds into one in target `context`.
   *
   * @param first  First seed to combine.
   * @param second  Second seed to combine.
   * @param context  Target context.
   *
   * @returns Context value seed combining value sources from both seeds.
   */
  combine(first: TSeed, second: TSeed, context: TCtx): TSeed;

}

/**
 * Context seeds provider.
 *
 * @typeParam TCtx  Context type.
 */
export type ContextSeeds<TCtx extends ContextValues> =
/**
 * @typeParam TSrc  Source value type.
 * @typeParam TSeed  Value seed type.
 *
 * @param key  Context value seed key.
 * @param context  Target context.
 *
 * @returns Context value seed associated with the given `key` provided for target `context`.
 */
    <TSrc, TSeed>(this: void, key: ContextSeedKey<TSrc, TSeed>, context: TCtx) => TSeed | undefined;

export namespace ContextSeeds {

  /**
   * Headless context seeds provider.
   *
   * Such provider does not depend on context.
   */
  export type Headless =
  /**
   * @typeParam TSrc  Source value type.
   * @typeParam TSeed  Value seed type.
   *
   * @param key  Context value seed key.
   * @param context  Target context.
   *
   * @returns Context value seed associated with the given `key` provided for target `context`.
   */
      <TSrc, TSeed>(this: void, key: ContextSeedKey<TSrc, TSeed>) => TSeed | undefined;

}
