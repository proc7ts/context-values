/**
 * @packageDocumentation
 * @module @proc7ts/fun-events/updatable
 */
import type { EventKeeper } from '@proc7ts/fun-events';
import { AfterEvent, AfterEvent__symbol, OnEvent } from '@proc7ts/fun-events';
import type { ContextModule } from './context-module';
import type { ContextModuleStatus } from './context-module-status';

/**
 * A handle of dynamically loaded context module.
 *
 * This value is {@link ContextValues.get returned from context} when the module is used as a key.
 *
 * Implements an `EventKeeper` interface by sending a {@link ContextModuleStatus module load status} updates.
 */
export abstract class ContextModuleHandle implements EventKeeper<[ContextModuleStatus]> {

  /**
   * An `OnEvent` sender of the module readiness event.
   *
   * Sends the {@link ContextModuleStatus.module loaded module} instance when it is {@link ContextModuleStatus.ready
   * ready fo use}.
   */
  abstract readonly whenReady: OnEvent<[ContextModule]>;

  /**
   * An `AfterEvent` keeper of module load status.
   *
   * The `[AfterEvent__symbol]` property is an alias of this one.
   */
  abstract readonly read: AfterEvent<[ContextModuleStatus]>;

  [AfterEvent__symbol](): AfterEvent<[ContextModuleStatus]> {
    return this.read;
  }

}
