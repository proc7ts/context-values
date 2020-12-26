/**
 * @packageDocumentation
 * @module @proc7ts/fun-events/updatable
 */
import type { Supply, SupplyPeer } from '@proc7ts/primitives';
import type { ContextValueSpec } from '../../context-value-spec';
import type { ContextValues } from '../../context-values';
import type { ContextModule } from './context-module';

/**
 * Context module setup.
 *
 * Passed to {@link ContextModule.setup module setup method} in order to access and provide the necessary values.
 *
 * @typeParam TCtx - Target context type.
 */
export interface ContextModuleSetup extends ContextValues, SupplyPeer {

  /**
   * The module to set up.
   */
  readonly module: ContextModule;

  /**
   * Module supply.
   *
   * This supply will be cut off once the module is unloaded.
   */
  readonly supply: Supply;

  /**
   * Provides context value.
   *
   * The value provider will be removed automatically once the module is unloaded.
   *
   * @typeParam TDeps - Dependencies tuple type.
   * @typeParam TSrc - Source value type.
   * @typeParam TSeed - Value seed type.
   * @param spec - Context value specifier.
   *
   * @returns Provider supply instance that removes just added context value provider once cut off.
   */
  provide<TDeps extends any[], TSrc, TSeed>(
      spec: ContextValueSpec<ContextValues, unknown, TDeps, TSrc, TSeed>,
  ): Supply;

}
