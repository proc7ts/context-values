/**
 * @packageDocumentation
 * @module @proc7ts/context-values
 */
import { ContextRef } from './context-ref';
import { ContextRegistry } from './context-registry';
import { ContextSeeder } from './context-seeder';
import { ContextValues } from './context-values';

/**
 * A symbol of the property containing a [[ContextKey]] instance.
 */
export const ContextKey__symbol = /*#__PURE__*/ Symbol('context-key');

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
export abstract class ContextKey<Value, Src = Value, Seed = unknown> implements ContextRef<Value, Src> {

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
  get [ContextKey__symbol](): this {
    return this;
  }

  /**
   * Grows context value out of its seed.
   *
   * @param slot  Context value slot to insert the value to.
   */
  abstract grow(slot: ContextValueSlot<Value, Src, Seed>): void;

  toString(): string {
    return `ContextKey(${this.name})`;
  }

}

/**
 * Context value slot to put the grown value into.
 *
 * An instance of the value slot is passed to [[ContextKey.grow]] method to provide the necessary context and optionally
 * accept a new value.
 *
 * @typeparam Value  Context value type.
 * @typeparam Src  Source value type.
 * @typeparam Seed  Value seed type.
 */
export type ContextValueSlot<Value, Src, Seed> =
    | ContextValueSlot.WithFallback<Value, Src, Seed>
    | ContextValueSlot.WithoutFallback<Value, Src, Seed>;

export namespace ContextValueSlot {

  /**
   * Base context value slot interface.
   *
   * @typeparam Value  Context value type.
   * @typeparam Src  Source value type.
   * @typeparam Seed  Value seed type.
   */
  export interface Base<Value, Src, Seed> {

    /**
     * Target context.
     */
    readonly context: ContextValues;

    /**
     * A key to associated value with.
     */
    readonly key: ContextKey<Value, Src, Seed>;

    /**
     * Context value seeder.
     */
    readonly seeder: ContextSeeder<ContextValues, Src, Seed>;

    /**
     * Context value seed.
     */
    readonly seed: Seed;

    /**
     * Whether a {@link ContextRequest.Opts.or fallback} value has been specified.
     */
    readonly hasFallback: boolean;

    /**
     * A {@link ContextRequest.Opts.or fallback} value that will be used unless another one {@link insert inserted} into
     * this slot.
     *
     * Can be `null` or `undefined`.
     *
     * Always `undefined` when {@link hasFallback there is no fallback}.
     */
    readonly or: Value | null | undefined;

    /**
     * Insert the value into the slot.
     *
     * The value will be associated with key after [[ContextKey.grow]] method exit.
     *
     * Supersedes a previously inserted value.
     *
     * @param value  A value to associate with the key, or `null`/`undefined` to not associate any value.
     */
    insert(value: Value | null | undefined): void;

    /**
     * Fills this slot by the given function.
     *
     * @param grow  A function accepting a value slot as its only parameter.
     *
     * @returns A value associated with target key by the given function, or `null`/`undefined` when no value
     * associated.
     */
    fillBy(grow: (this: void, slot: ContextValueSlot<Value, Src, Seed>) => void): Value | null | undefined;

    /**
     * Registers a setup procedure issued when context value associated with target key.
     *
     * Setup will be issued at most once per context. Setup won't be issued if no value {@link insert inserted}.
     *
     * @param setup  Context value setup procedure.
     */
    setup(setup: ContextValueSetup<Value, Src, Seed>): void;

  }

  /**
   * Base context value slot with fallback value.
   *
   * @typeparam Value  Context value type.
   * @typeparam Src  Source value type.
   * @typeparam Seed  Value seed type.
   */
  export interface WithFallback<Value, Src, Seed> extends Base<Value, Src, Seed> {

    /**
     * Whether a {@link ContextRequest.Opts.or fallback} value has been specified.
     *
     * Always `true`
     */
    readonly hasFallback: true;

    /**
     * A {@link ContextRequest.Opts.or fallback} value that will be used unless another one {@link insert inserted} into
     * this slot.
     *
     * Can be `null` or `undefined`.
     */
    readonly or: Value | null | undefined;

  }

  export interface WithoutFallback<Value, Src, Seed> extends Base<Value, Src, Seed> {

    /**
     * Whether a {@link ContextRequest.Opts.or fallback} value has been specified.
     *
     * Always `false`
     */
    readonly hasFallback: false;

    /**
     * A {@link ContextRequest.Opts.or fallback} value that will be used unless another one {@link insert inserted} into
     * this slot.
     *
     * Always `undefined`.
     */
    readonly or: undefined;

  }

}

/**
 * Context value setup procedure signature.
 *
 * A function with this signature can be passed to {@link ContextValueSlot.Base.setup} method to be issued when
 * the value associated with target key.
 */
export type ContextValueSetup<Value, Src, Seed> =
/**
 * @param key  A key the value associated with.
 * @param context  Target context the value associated with.
 * @param registry  A registry of context value providers. This context is shared among all contexts
 * {@link ContextRegistry.newValues created} by it.
 */
    (
        this: void,
        {
          key,
          context,
          registry,
        }: {
          key: ContextKey<Value, Src, Seed>;
          context: ContextValues;
          registry: ContextRegistry;
        }
    ) => void;

/**
 * A provider of default value of context key.
 *
 * This is typically passed as `byDefault` option to context value key constructor.
 *
 * @typeparam Ctx  Context type.
 * @typeparam Value  Context value type.
 * @typeparam Key  Context key type.
 */
export type ContextKeyDefault<Value, Key extends ContextKey<any, any, any>> =
/**
 * @param context  Target context.
 * @param key  Context value key the default value is provided for.
 *
 * @return Either constructed value, or `null`/`undefined` if unknown.
 */
    (this: void, context: ContextValues, key: Key) => Value | null | undefined;

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
  constructor(key: ContextKey<any, Src>) {
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

  grow(opts: ContextValueSlot<Seed, Src, Seed>): void {

    const { seeder, seed } = opts;

    if (!seeder.isEmpty(seed)) {
      opts.insert(seed);
    } else if (!opts.hasFallback) {
      opts.insert(seed);
    }
  }

}
