/**
 * @module context-values
 */
import { ContextSeedKey } from './context-key';
import { ContextTarget, ContextValueProvider } from './context-value-spec';
import { ContextValues } from './context-values';

export interface ContextSeed {

  /**
   * Whether this seed is empty.
   *
   * This is `true` when no providers added to the seeder.
   */
  readonly empty: boolean;

}

/**
 * Context value seeder.
 *
 * Contains context value providers for particular key.
 *
 * Created by [[ContextSourceKey.seeder]] method.
 *
 * @typeparam Ctx  Context type.
 * @typeparam Src  Source value type.
 * @typeparam Seed  Context value seed type.
 * @typeparam Self  This type.
 */
export interface ContextSeeder<Ctx extends ContextValues, Src, Seed extends ContextSeed> {

  /**
   * Provides context value.
   *
   * @param provider  Context value provider.
   */
  provide(provider: ContextValueProvider<Ctx, Src>): void;

  /**
   * Creates context value seed for target `context`.
   *
   * @param context  Target context.
   * @param initial  Initial seed the constructed one should derive values from.
   *
   * @returns New context value seed.
   */
  seed(context: Ctx, initial?: Seed): Seed;

  /**
   * Combines two seeds into one in target `context`.
   *
   * @param context  Target context.
   * @param first  First seed to combine.
   * @param second  Second seed to combine.
   *
   * @returns Context value seed combining value sources from both seeds.
   */
  combine(context: Ctx, first: Seed, second: Seed): Seed;

}

/**
 * A provider of context value seeds.
 *
 * @typeparam Ctx  Context type.
 */
export type ContextSeedProvider<Ctx extends ContextValues> =
/**
 * @typeparam Src  Source value type.
 * @typeparam Seed  Value seed type.
 *
 * @param context  Target context.
 * @param key  Context value seed key.
 *
 * @returns Context value seed associated with the given `key` provided for target `context`.
 */
    <Src, Seed extends ContextSeed>(this: void, context: Ctx, key: ContextSeedKey<Src, Seed>) => Seed | undefined;
