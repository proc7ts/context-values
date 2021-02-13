import type { AfterEvent } from '@proc7ts/fun-events';
import { shareAfter, translateAfter_ } from '@proc7ts/fun-events';
import { isPresent } from '@proc7ts/primitives';
import { filterIt, mapIt } from '@proc7ts/push-iterator';
import type { ContextValues } from '../../context-values';
import type { Contextual } from '../../conventional';
import { Contextual__symbol, isContextual } from '../../conventional';

/**
 * Creates an event processor that {@link applyContextTo} applies context to values and their {@link Contextual
 * contextual references} incoming from {@link AfterEvent} keeper.
 *
 * This function is applicable to updatable context value {@link ContextUpKey.Source sources} potentially containing
 * contextual references.
 *
 * @typeParam T - Value type.
 * @typeParam TCtx - Supported context type.
 * @param context - A context to apply.
 *
 * @returns A mapping function of `AfterEvent` keeper of values, their contextual references, or `null`/`undefined`
 * elements to `AfterEvent` keeper of resolved values.
 */
export function applyContextAfter<T, TCtx extends ContextValues = ContextValues>(
    context: TCtx,
): (this: void, source: AfterEvent<(T | Contextual<T, TCtx> | null | undefined)[]>) => AfterEvent<T[]> {

  const processor = applyContextAfter_<T, TCtx>(context);

  return source => shareAfter(processor(source));
}

/**
 * Creates an event processor that {@link applyContextTo} applies context to values and their {@link Contextual
 * contextual references} incoming from {@link AfterEvent} keeper, and does not share the outgoing events supply.
 *
 * This function is applicable to updatable context value {@link ContextUpKey.Source sources} potentially containing
 * contextual references to resolve the latter before providing to context.
 *
 * @typeParam T - Value type.
 * @typeParam TCtx - Supported context type.
 * @param context - A context to apply.
 *
 * @returns A mapping function of `AfterEvent` keeper of values, their contextual references, or `null`/`undefined`
 * elements to `AfterEvent` keeper of resolved values.
 */
export function applyContextAfter_<// eslint-disable-line @typescript-eslint/naming-convention
    T,
    TCtx extends ContextValues = ContextValues>(
    context: TCtx,
): (this: void, source: AfterEvent<(T | Contextual<T, TCtx> | null | undefined)[]>) => AfterEvent<T[]> {
  return translateAfter_((send, ...values) => send(
      ...filterIt<T | null | undefined, T>(
          mapIt(
              values,
              (value): T | null | undefined => isContextual(value)
                  ? value[Contextual__symbol](context)
                  : value,
          ),
          isPresent,
      ),
  ));
}
