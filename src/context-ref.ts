import type { ContextRequest } from './context-request';
import { ContextKey, ContextKey__symbol } from './key';
import type { ContextTarget } from './registry';

/**
 * Context value reference that can serve both as {@link ContextRequest} and as {@link ContextTarget}.
 *
 * @typeParam TValue - Context value type.
 * @typeParam TSrc - Source value type.
 */
export interface ContextRef<TValue, TSrc = TValue> extends ContextRequest<TValue>, ContextTarget<TSrc> {

  readonly [ContextKey__symbol]: ContextKey<TValue, TSrc>;

}
