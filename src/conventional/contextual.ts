import type { ContextValues } from '../context-values';

/**
 * A key of {@link Contextual contextual value reference} method resolving a contextual instance.
 */
export const Contextual__symbol = (/*#__PURE__*/ Symbol('Contextual'));

/**
 * Contextual value reference.
 *
 * @typeParam T - Referred contextual instance type.
 * @typeParam TCtx - Supported context type.
 */
export interface Contextual<T, TCtx extends ContextValues = ContextValues> {

  /**
   * Resolves a contextual instance for the target context.
   *
   * @param context - Target context.
   *
   * @returns Either contextual instance, or `null`/`undefined` when not resolved.
   */
  [Contextual__symbol](context: TCtx): T | null | undefined;

}

export namespace Contextual {

  /**
   * Mandatory contextual value reference.
   *
   * Always resolves to some value.
   *
   * @typeParam T - Referred contextual instance type.
   * @typeParam TCtx - Supported context type.
   */
  export interface Mandatory<T, TCtx extends ContextValues = ContextValues> {

    /**
     * Resolves a contextual instance for the target context.
     *
     * @param context - Target context.
     *
     * @returns Contextual instance.
     */
    [Contextual__symbol](context: TCtx): T;

  }

}

/**
 * Checks whether the given value is a {@link Contextual.Mandatory mandatory contextual reference}.
 *
 * @typeParam T - Expected referred contextual instance type.
 * @typeParam TCtx - Expected context type.
 * @typeParam TOther - Another type the value may have.
 * @param value - A value to check.
 *
 * @returns `true` if the given `value` has a {@link Contextual__symbol} method that always returns some value,
 * or `false` otherwise.
 */
export function isContextual<T, TCtx extends ContextValues = ContextValues, TOther = unknown>(
    value: Contextual.Mandatory<T, TCtx> | TOther,
): value is Contextual.Mandatory<T, TCtx>;

/**
 * Checks whether the given value is a {@link Contextual contextual reference}.
 *
 * @typeParam T - Expected referred contextual instance type.
 * @typeParam TCtx - Expected context type.
 * @typeParam TOther - Another type the value may have.
 * @param value - A value to check.
 *
 * @returns `true` if the given `value` has a {@link Contextual__symbol} method, or `false` otherwise.
 */
export function isContextual<T, TCtx extends ContextValues = ContextValues, TOther = unknown>(
    value: Contextual<T, TCtx> | TOther,
): value is Contextual<T, TCtx>;

export function isContextual<T, TCtx extends ContextValues = ContextValues, TOther = unknown>(
    value: Contextual<T, TCtx> | TOther,
): value is Contextual<T, TCtx> {
  return !!value
      && (typeof value === 'object' || typeof value === 'function')
      && typeof (value as Partial<Contextual<T, TCtx>>)[Contextual__symbol] === 'function';
}
