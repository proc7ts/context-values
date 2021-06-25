import type { ContextValues } from '../context-values';
import type { ContextKey } from './context-key';
import type { ContextSeeder } from './context-seeder';
import type { ContextValueSetup } from './context-value-setup';

/**
 * Context value slot to put the grown value into.
 *
 * An instance of the value slot is passed to {@link ContextKey.grow} method to provide the necessary context
 * and optionally accept a new value.
 *
 * @typeParam TValue - Context value type.
 * @typeParam TSrc - Source value type.
 * @typeParam TSeed - Value seed type.
 */
export interface ContextValueSlot<TValue, TSrc, TSeed> {

  /**
   * Target context.
   */
  readonly context: ContextValues;

  /**
   * A key to associate value with.
   */
  readonly key: ContextKey<TValue, TSrc, TSeed>;

  /**
   * Context value seeder.
   */
  readonly seeder: ContextSeeder<ContextValues, TSrc, TSeed>;

  /**
   * Context value seed.
   */
  readonly seed: TSeed;

  /**
   * A {@link ContextRequest.Opts.or fallback} value that will be used unless another one {@link insert inserted} into
   * this slot.
   *
   * The `undefined` value means there is no fallback.
   */
  readonly or: TValue | null | undefined;

  /**
   * Insert the value into the slot.
   *
   * The value will be associated with key after {@link ContextKey.grow} method exit.
   *
   * Supersedes a previously inserted value.
   *
   * @param value - A value to associate with the key, or `null`/`undefined` to not associate any value.
   */
  insert(value: TValue | null | undefined): void;

  /**
   * Fills this slot by the given function.
   *
   * @param grow - A function accepting a value slot as its only parameter.
   *
   * @returns A value associated with target key by the given function, or `null`/`undefined` when no value
   * associated.
   */
  fillBy(grow: (this: void, slot: ContextValueSlot<TValue, TSrc, TSeed>) => void): TValue | null | undefined;

  /**
   * Registers a setup procedure issued when context value associated with target key.
   *
   * Setup will be issued at most once per context. Setup won't be issued if no value {@link insert inserted}.
   *
   * @param setup - Context value setup procedure.
   */
  setup(setup: ContextValueSetup<TValue, TSrc, TSeed>): void;

}
