import { valueProvider } from '@proc7ts/primitives';
import type { ContextValues } from '../context-values';
import type { ContextValueProvider } from '../registry';
import type { Contextual } from './contextual';
import { Contextual__symbol, isContextual } from './contextual';

/**
 * Converts a value or its {@link Contextual contextual reference} to context value {@link ContextValueProvider
 * provider}.
 *
 * @typeParam T - Value type.
 * @typeParam TCtx - Supported context type.
 * @param value - A value to convert. May be either a bare value, its contextual reference, or `null`/`undefined` to
 * provide nothing.
 *
 * @returns Context value provider.
 */
export function applyContextTo<T, TCtx extends ContextValues = ContextValues>(
    value: Contextual<T, TCtx> | T | null | undefined,
): ContextValueProvider<T, TCtx> {
  return isContextual(value)
      ? context => value[Contextual__symbol](context)
      : valueProvider(value);
}
