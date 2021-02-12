import type { ContextValues } from '../context-values';
import { ContextKey } from './context-key';
import type { ContextSeeder } from './context-seeder';
import type { ContextValueSlot } from './context-value-slot';

/**
 * A key of context value holding a seed of context value.
 *
 * @typeParam TSrc - Source value type.
 * @typeParam TSeed - Value seed type.
 */
export abstract class ContextSeedKey<TSrc, TSeed> extends ContextKey<TSeed, TSrc, TSeed> {

  /**
   * Constructs context value sources key.
   *
   * @param key - A key of context value having its sources associated with this key.
   */
  constructor(key: ContextKey<unknown, TSrc>) {
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
   * @typeParam TCtx - Context type.
   *
   * @returns New value seeder instance.
   */
  abstract seeder<TCtx extends ContextValues>(): ContextSeeder<TCtx, TSrc, TSeed>;

  grow(opts: ContextValueSlot<TSeed, TSrc, TSeed>): void {

    const { seeder, seed } = opts;

    if (!seeder.isEmpty(seed)) {
      opts.insert(seed);
    } else if (!opts.hasFallback) {
      opts.insert(seed);
    }
  }

}
