import type { ContextValues } from '../context-values';
import type { ContextRegistry } from '../registry';
import type { ContextKey } from './context-key';

/**
 * Context value setup procedure signature.
 *
 * A function with this signature can be passed to {@link ContextValueSlot.Base.setup} method to be issued when
 * the value associated with target key.
 *
 * @typeParam TValue - Context value type.
 * @typeParam TSrc - Source value type.
 * @typeParam TSeed - Value seed type.
 */
export type ContextValueSetup<TValue, TSrc, TSeed> =
/**
 * @param key - A key the value associated with.
 * @param context - Target context the value associated with.
 * @param registry - A registry of context value providers. This context is shared among all contexts
 * {@link ContextRegistry.newValues created} by it.
 */
    (
        this: void,
        {
          key,
          context,
          registry,
        }: {
          key: ContextKey<TValue, TSrc, TSeed>;
          context: ContextValues;
          registry: ContextRegistry;
        }
    ) => void;
