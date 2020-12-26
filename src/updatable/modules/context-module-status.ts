/**
 * @packageDocumentation
 * @module @proc7ts/fun-events/updatable
 */
import type { ContextModule } from './context-module';

/**
 * Context module load status.
 *
 * This status is reported by {@link ContextModuleHandle loaded module handle}.
 */
export interface ContextModuleStatus {

  /**
   * Loaded module.
   *
   * Note that it may differ from the one requested to load. E.g. when another module {@link ContextModuleOptions.has
   * provides} it.
   */
  readonly module: ContextModule;

  /**
   * Whether the module is loaded and ready for use.
   */
  readonly ready: boolean;

}
