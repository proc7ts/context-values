import type { Supply } from '@proc7ts/primitives';
import type { ContextValues } from '../context-values';
import type { ContextRegistry } from './context-registry';

/**
 * A key of {@link ContextBuilder context builder} method that provides context values.
 */
export const ContextBuilder__symbol = (/*#__PURE__*/ Symbol('ContextBuilder'));

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
