/**
 * @packageDocumentation
 * @module @proc7ts/context-values/updatable
 */
/**
 * Creates a function that throws a context destruction reason.
 *
 * This may be handy when {@link ContextSupply context supply} is cut off.
 *
 * @param reason - Context destruction reason.
 */
export function contextDestroyed(reason: unknown = new TypeError('Context destroyed')): () => never {
  return () => {
    throw reason;
  };
}
