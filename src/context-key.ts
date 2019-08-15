/**
 * @module context-values
 */
import { ContextRequest } from './context-request';
import { ContextSeed, ContextSeeder } from './context-seed';
import { ContextTarget } from './context-value-spec';
import { ContextValues } from './context-values';

/**
 * Context value key.
 *
 * Every key should be an unique instance of this class.
 *
 * Multiple source values pay be provided per per value key. They all grouped into single seed.
 * The value is grown from this seed by [[ContextKey.grow]] method.
 *
 * @typeparam Value  Context value type.
 * @typeparam Src  Source value type.
 * @typeparam Seed  Value seed type.
 */
export abstract class ContextKey<Value, Src = Value, Seed extends ContextSeed = any>
    implements ContextRequest<Value>, ContextTarget<Src> {

  /**
   * Human-readable key name.
   *
   * This is not necessarily unique.
   */
  readonly name: string;

  /**
   * A key of context value holding a {@link ContextSeed seed} of the value associated with this key.
   *
   * Different context value keys may have the same [[seedKey]] to grow them from the same seed.
   */
  abstract readonly seedKey: ContextSeedKey<Src, Seed>;

  /**
   * Constructs context value key.
   *
   * @param name  Human-readable key name.
   */
  protected constructor(name: string) {
    this.name = name;
  }

  /**
   * Always the key itself.
   *
   * This is to use this context value key both as a context value request and its definition target.
   */
  get key(): this {
    return this;
  }

  /**
   * Grows context value out of its seed.
   *
   * @param context  Target context.
   * @param seed  Context value seed.
   * @param handleDefault  Default value handler. The default values should be passed through it.
   *
   * @returns Single context value, or `undefined` if there is no default value.
   */
  abstract grow(
      context: ContextValues,
      seed: Seed,
      handleDefault: DefaultContextValueHandler<Value>,
  ): Value | null | undefined;

  toString(): string {
    return `ContextKey(${this.name})`;
  }

}

/**
 * Default context value handler.
 *
 * It is called from [[ContextKey.merge]] operation to select a default value. As a fallback value always takes
 * precedence over the default one specified by the value key.
 *
 * @typeparam V  A type of context value.
 */
export type DefaultContextValueHandler<V> =
/**
 * @param defaultProvider  Default value provider. It is called unless a fallback value is specified.
 * If it returns a non-null/non-undefined value, then the returned value will be associated with the context key.
 *
 * @returns The default value to return.
 *
 * @throws Error  If there is no explicitly specified default value, and `defaultProvider` did not provide any value.
 */
    (defaultProvider: () => V | null | undefined) => V | null | undefined;

/**
 * A key of context value holding a seed of context value.
 *
 * @typeparam Src  Source value type.
 * @typeparam Seed  Value seed type.
 */
export abstract class ContextSeedKey<Src, Seed extends ContextSeed> extends ContextKey<Seed, Src, Seed> {

  /**
   * Constructs context value sources key.
   *
   * @param key  A key of context value having its sources associated with this key.
   */
  protected constructor(key: ContextKey<any, Src>) {
    super(`${key.name}:seed`);
  }

  /**
   * Always refers to itself.
   */
  get seedKey(): this {
    return this;
  }

  /**
   * Creates a seeder for values associated with this key.
   *
   * @typeparam Ctx  Context type.
   *
   * @returns New value seeder instance.
   */
  abstract seeder<Ctx extends ContextValues>(): ContextSeeder<Ctx, Src, Seed>;

  grow(
      context: ContextValues,
      seed: Seed,
      handleDefault: DefaultContextValueHandler<Seed>,
  ): Seed | null | undefined {
    if (!seed.empty) {
      return seed;
    }
    return handleDefault(() => seed);
  }

}
