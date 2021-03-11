import type { Supply } from '@proc7ts/supply';
import type { ContextValues } from '../context-values';
import type { ContextValueProvider } from '../registry';

/**
 * Context value seeder.
 *
 * Contains context value providers for particular key.
 *
 * Created by {@link ContextSeedKey.seeder} method.
 *
 * @typeParam TCtx - Context type.
 * @typeParam TSrc - Source value type.
 * @typeParam TSeed - Context value seed type.
 */
export interface ContextSeeder<TCtx extends ContextValues, TSrc, TSeed> {

  /**
   * Provides context value.
   *
   * @param provider - Context value provider.
   *
   * @returns Provider supply instance that removes just added context value provider once cut off.
   */
  provide(provider: ContextValueProvider<TSrc, TCtx>): Supply;

  /**
   * Creates context value seed for target `context`.
   *
   * @param context - Target context.
   * @param initial - Initial seed the constructed one should derive values from.
   *
   * @returns New context value seed.
   */
  seed(context: TCtx, initial?: TSeed): TSeed;

  /**
   * Checks whether the given context value `seed` is empty.
   *
   * @param seed - Context value seed to check.
   *
   * @returns `true` is the given seed does not contain any source values, or `false` otherwise.
   */
  isEmpty(seed: TSeed): boolean;

  /**
   * Combines two seeds into one in target `context`.
   *
   * @param first - First seed to combine.
   * @param second - Second seed to combine.
   * @param context - Target context.
   *
   * @returns Context value seed combining value sources from both seeds.
   */
  combine(first: TSeed, second: TSeed, context: TCtx): TSeed;

}
