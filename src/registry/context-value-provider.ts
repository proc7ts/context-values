import type { ContextValues } from '../context-values';

/**
 * Context value provider.
 *
 * When used to provide a value associated with particular context key, it provides a source value rather a context
 * value itself.
 *
 * @typeParam T - Provided value type.
 * @typeParam TCtx - Supported context type.
 */
export type ContextValueProvider<T, TCtx extends ContextValues = ContextValues> =
/**
 * @param context - Target context.
 *
 * @return Either provided value, or `null`/`undefined` when unknown.
 */
    (this: void, context: TCtx) => T | null | undefined;
