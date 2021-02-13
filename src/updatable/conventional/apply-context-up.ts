import type { AfterEvent } from '@proc7ts/fun-events';
import type { ContextValues } from '../../context-values';
import type { Contextual } from '../../conventional';
import type { ContextValueProvider } from '../../registry';
import { applyContextAfter } from './apply-context-after';

/**
 * Converts an `AfterEvent` keeper of values or their {@link Contextual contextual references} to context value
 * {@link ContextValueProvider provider} of `AfterEvent` keeper of resolved values.
 *
 * This function is applicable to updatable context value {@link ContextUpKey.Source sources} potentially containing
 * contextual references to resolve the latter before providing to context.
 *
 * @typeParam T - Value type.
 * @typeParam TCtx - Supported context type.
 * @param source - An `AfterEvent` keeper of values, their contextual references, or `null`/`undefined` elements.
 *
 * @returns Context value provider.
 */
export function applyContextUp<T, TCtx extends ContextValues = ContextValues>(
    source: AfterEvent<(T | Contextual<T> | null | undefined)[]>,
): ContextValueProvider<AfterEvent<T[]>, TCtx> {
  return context => applyContextAfter<T, TCtx>(context)(source);
}
