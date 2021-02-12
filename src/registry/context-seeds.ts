import type { ContextValues } from '../context-values';
import type { ContextSeedKey } from '../key';

/**
 * Context seeds provider.
 *
 * @typeParam TCtx - Context type.
 */
export type ContextSeeds<TCtx extends ContextValues> =
/**
 * @typeParam TSrc - Source value type.
 * @typeParam TSeed - Value seed type.
 * @param key - Context value seed key.
 * @param context - Target context.
 *
 * @returns Context value seed associated with the given `key` provided for target `context`, or `undefined` if there
 * is no such seed.
 */
    <TSrc, TSeed>(this: void, key: ContextSeedKey<TSrc, TSeed>, context: TCtx) => TSeed | undefined;

export namespace ContextSeeds {

  /**
   * Mandatory context seeds provider.
   *
   * Does not necessarily provide a seed for the key.
   *
   * @typeParam TCtx - Context type.
   */
  export type Mandatory<TCtx> =
  /**
   * @typeParam TSrc - Source value type.
   * @typeParam TSeed - Value seed type.
   * @param key - Context value seed key.
   * @param context - Target context.
   *
   * @returns Context value seed associated with the given `key` provided for target `context`.
   */
      <TSrc, TSeed>(this: void, key: ContextSeedKey<TSrc, TSeed>, context: TCtx) => TSeed;

  /**
   * Headless context seeds provider.
   *
   * Such provider does not depend on context.
   */
  export type Headless =
  /**
   * @typeParam TSrc - Source value type.
   * @typeParam TSeed - Value seed type.
   * @param key - Context value seed key.
   * @param context - Target context.
   *
   * @returns Context value seed associated with the given `key` provided for target `context`.
   */
      <TSrc, TSeed>(this: void, key: ContextSeedKey<TSrc, TSeed>) => TSeed;

}
