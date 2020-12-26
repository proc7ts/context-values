/**
 * @packageDocumentation
 * @module @proc7ts/context-values
 */
import type { Supply } from '@proc7ts/primitives';
import type { ContextRegistry } from './context-registry';
import type { ContextValues } from './context-values';

/**
 * A key of {@link ContextBuilder context builder} method that provides context values.
 */
export const ContextBuilder__symbol = (/*#__PURE__*/ Symbol('context-value-registrar'));

/**
 * Context builder.
 *
 * Able to provide arbitrary context values.
 *
 * @typeParam TCtx - Supported context type.
 */
export interface ContextBuilder<TCtx extends ContextValues = ContextValues> {

  /**
   * Provides context values with the given registry.
   *
   * @param registry - A context registry to provide values with.
   *
   * @returns A supply instance that removes the added context value providers once cut off.
   */
  [ContextBuilder__symbol](registry: ContextRegistry<TCtx>): Supply;

}
