/**
 * @packageDocumentation
 * @module @proc7ts/fun-events/updatable
 */
import type { ContextModule } from './context-module';
import type { ContextModuleSetup } from './context-module-setup';

/**
 * Context module construction options.
 */
export interface ContextModuleOptions {

  /**
   * The module the constructed one aliases.
   *
   * The aliased module is {@link ContextModuleStatus.module reported} when constructed module loaded.
   *
   * This is useful to report a module replacement.
   *
   * @defaultValue The module itself.
   */
  readonly aliases?: ContextModule;

  /**
   * A module or modules the constructed one requires.
   *
   * The listed modules will be loaded prior to loading the constructed one.
   */
  readonly needs?: ContextModule | readonly ContextModule[];

  /**
   * A module or modules the constructed one provides.
   *
   * When specified, the constructed module will be loaded _instead_ of the listed ones.
   *
   * The module always provides itself.
   */
  readonly has?: ContextModule | readonly ContextModule[];

  /**
   * Sets up constructed module.
   *
   * This method is called when loading the module. It is used e.g. to provide more values for the context.
   *
   * @param setup - Context module setup.
   *
   * @returns Either nothing to set up the module synchronously, or a promise-like instance resolved when the module
   * is set up asynchronously.
   */
  setup?(setup: ContextModuleSetup): void | PromiseLike<void>;

}
