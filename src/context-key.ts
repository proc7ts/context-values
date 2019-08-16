/**
 * @module context-values
 */
import { ContextRequest } from './context-request';
import { ContextSeeder } from './context-seeder';
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
export abstract class ContextKey<Value, Src = Value, Seed = any>
    implements ContextRequest<Value>, ContextTarget<Src> {

  /**
   * Human-readable key name.
   *
   * This is not necessarily unique.
   */
  readonly name: string;

  /**
   * A key of context value holding a seed of the value associated with this key.
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
   * @typeparam Ctx  Context type.
   * @param opts  Context value growth options.
   *
   * @returns Single context value, or `undefined` if there is no default value.
   */
  abstract grow<Ctx extends ContextValues>(opts: ContextValueOpts<Ctx, Value, Src, Seed>): Value | null | undefined;

  toString(): string {
    return `ContextKey(${this.name})`;
  }

}

/**
 * Context value growth options.
 *
 * An instance of these options is passed to [[ContextKey.grow]] method to provide the necessary value growth context.
 *
 * @typeparam Ctx  Context type.
 * @typeparam Value  Context value type.
 * @typeparam Src  Source value type.
 * @typeparam Seed  Value seed type.
 */
export interface ContextValueOpts<Ctx extends ContextValues, Value, Src, Seed> {

  /**
   * Target context.
   */
  readonly context: Ctx;

  /**
   * Context value seeder.
   */
  readonly seeder: ContextSeeder<Ctx, Src, Seed>;

  /**
   * Context value seed.
   */
  readonly seed: Seed;

  /**
   * Handles missing context value.
   *
   * It can be called to prefer a fallback value over default one specified by the value key.
   *
   * @param defaultProvider  Default value provider. It is called unless a fallback value is specified.
   * If it returns a non-null/non-undefined value, then the returned value will be associated with the context key.
   */
  byDefault(defaultProvider: () => Value | null | undefined): Value | null | undefined;

}

/**
 * A key of context value holding a seed of context value.
 *
 * @typeparam Src  Source value type.
 * @typeparam Seed  Value seed type.
 */
export abstract class ContextSeedKey<Src, Seed> extends ContextKey<Seed, Src, Seed> {

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

  grow<Ctx extends ContextValues>(opts: ContextValueOpts<Ctx, Seed, Src, Seed>): Seed | null | undefined {

    const { seeder, seed } = opts;

    return seeder.isEmpty(seed) ? opts.byDefault(() => seed) : seed;
  }

}
