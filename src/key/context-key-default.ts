import type { ContextValues } from '../context-values';
import type { ContextKey } from './context-key';

/**
 * A provider of default value of context key.
 *
 * This is typically passed as `byDefault` option to context value key constructor.
 *
 * @typeParam TValue - Context value type.
 * @typeParam TKey - Context key type.
 */
export type ContextKeyDefault<TValue, TKey extends ContextKey<unknown, unknown>> =
/**
 * @param context - Target context.
 * @param key - Context value key the default value is provided for.
 *
 * @return Either constructed value, or `null`/`undefined` if unknown.
 */
    (this: void, context: ContextValues, key: TKey) => TValue | null | undefined;
