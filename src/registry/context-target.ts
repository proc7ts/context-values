import type { ContextRequest } from '../context-request';
import { ContextKey, ContextKey__symbol } from '../key';

/**
 * Context value definition target.
 *
 * Designates a declared declaring context value.
 *
 * @typeParam TSrc - A type of declared context value sources.
 * @typeParam TSeed - Declared value seed type.
 */
export interface ContextTarget<TSrc, TSeed = unknown> extends ContextRequest<unknown, TSeed> {

  /**
   * A key of context value to provide.
   */
  readonly [ContextKey__symbol]: ContextKey<unknown, TSrc, TSeed>;

}
