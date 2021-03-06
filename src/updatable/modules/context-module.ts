import type { AfterEvent, EventKeeper, OnEvent } from '@proc7ts/fun-events';
import type { Supply, SupplyPeer } from '@proc7ts/supply';
import type { ContextValues } from '../../context-values';
import { ContextKey__symbol } from '../../key';
import type { ContextRegistry, ContextValueSpec } from '../../registry';
import { ContextBuilder, ContextBuilder__symbol } from '../../registry';
import type { ContextUpKey, ContextUpRef } from '../context-up-key';
import { ContextModule$, ContextModule$impl__symbol } from './context-module.impl';

/**
 * Context module.
 *
 * Modules intended to extend the context dynamically.
 *
 * The module is a context value reference that can be used to provide module instance and access its
 * {@link ContextModule.Handle handle}.
 *
 * Usage example:
 * ```typescript
 * // Construct new module.
 * const myModule = new ContextModule('my module', {
 *   setup(setup) {
 *     // Provide the values
 *     setup.provide({ a: Foo, is: 'foo' });
 *   },
 * });
 *
 * // Load the module
 * const myModuleSupply = contextRegistry.provide(myModule);
 *
 * // Start using the module
 * const myModuleUse = await context.get(myModule).use();
 *
 * // Await for the module to load
 * await myModuleUse.whenReady;
 *
 * // Access the value provided by module.
 * console.log(context.get(Foo));
 *
 * // Stop using the module
 * myModuleUse.supply.off();
 *
 * // Unload the module declaration.
 * myModuleSupply.off();
 * ```
 */
export class ContextModule implements ContextUpRef<ContextModule.Handle, ContextModule>, ContextBuilder {

  /**
   * @internal
   */
  private readonly [ContextModule$impl__symbol]: ContextModule$;

  /**
   * Constructs context module.
   *
   * @param name - Human-readable module name.
   * @param options - Module construction options.
   */
  constructor(name: string, options: ContextModule.Options = {}) {
    this[ContextModule$impl__symbol] = new ContextModule$(this, name, options);
  }

  /**
   * A key of context module.
   */
  get [ContextKey__symbol](): ContextUpKey<ContextModule.Handle, ContextModule> {
    return this[ContextModule$impl__symbol].key;
  }

  /**
   * Human-readable module name.
   */
  get name(): string {
    return this[ContextModule$impl__symbol].name;
  }

  /**
   * The modules this one requires.
   *
   * Assigned by {@link ContextModule.Options.needs} option.
   */
  get needs(): ReadonlySet<ContextModule> {
    return this[ContextModule$impl__symbol].needs;
  }

  /**
   * The modules this one provides.
   *
   * Assigned by {@link ContextModule.Options.has} option.
   *
   * Always contains the module itself.
   */
  get has(): ReadonlySet<ContextModule> {
    return this[ContextModule$impl__symbol].has;
  }

  /**
   * Provides this module and {@link has module replacements}.
   */
  [ContextBuilder__symbol](registry: ContextRegistry): Supply {

    const supply = registry.provide({ a: this, is: this });

    this[ContextModule$impl__symbol].replace(this, registry, supply);

    return supply;
  }

  /**
   * Sets up the module.
   *
   * This method is called when loading the module. It is used e.g. to provide more values for the context.
   *
   * By default:
   *
   * 1. Satisfies module {@link needs dependencies} by setting them up.
   *
   *    The dependency considered satisfied when it is {@link ContextModule.Status.settled settled}.
   *
   * 2. {@link ContextModule.Setup.initBy Initializes} the module by initializing the dependencies.
   *
   *    The dependency considered initialized when it is {@link ContextModule.Status.ready ready for use}.
   *
   * 3. Performs the module setup by invoking the {@link ContextModule.Options.setup} method.
   *
   * @param setup - Context module setup.
   *
   * @returns A promise resolved when the module is set up asynchronously.
   */
  setup(setup: ContextModule.Setup): Promise<void> {
    return this[ContextModule$impl__symbol].setup(setup);
  }

  toString(): string {
    return `ContextModule(${this.name})`;
  }

}

export namespace ContextModule {

  /**
   * Context module construction options.
   */
  export interface Options {

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
    setup?(setup: ContextModule.Setup): void | PromiseLike<unknown>;

  }

  /**
   * Context module setup.
   *
   * Passed to {@link ContextModule.setup module setup method} in order to access and provide the necessary values.
   *
   * @typeParam TCtx - Target context type.
   */
  export interface Setup extends ContextValues, SupplyPeer {

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
     * @typeParam TSrc - Source value type.
     * @typeParam TDeps - Dependencies tuple type.
     * @param spec - Context value specifier.
     *
     * @returns Provider supply instance that removes just added context value provider once cut off.
     */
    provide<TSrc, TDeps extends any[]>(
        spec: ContextValueSpec<ContextValues, unknown, TSrc, TDeps>,
    ): Supply;

    /**
     * Registers the module initializer.
     *
     * The module initializer registration is only valid during its {@link ContextModule.setup setup}.
     *
     * The registered initializers executed after successful module {@link ContextModule.setup}. The modules
     * is considered {@link ContextModule.Status.ready ready for use} only when all registered initializers succeed.
     *
     * The registered initializers executed serially. I.e. then next one does not start until the previous one succeeds.
     *
     * It is an error calling this method when the module initialized already.
     *
     * @param init - The module initialization function, that returns nothing when the module initialization
     * completed synchronously, or a promise-like instance resolved when the module initialization completed
     * asynchronously.
     */
    initBy(init: (this: void) => void | PromiseLike<unknown>): void;

  }

  /**
   * A handle of dynamically loaded context module.
   *
   * This value is available in {@link ContextValues.get returned from context} under the module instance used as a key.
   *
   * Implements an `EventKeeper` interface by sending a {@link ContextModule.Status module load status} updates.
   */
  export interface Handle extends EventKeeper<[ContextModule.Status]> {

    /**
     * An `AfterEvent` keeper of module load status.
     *
     * The `[AfterEvent__symbol]` property is an alias of this one.
     */
    readonly read: AfterEvent<[ContextModule.Status]>;

    /**
     * Initiate the module use.
     *
     * @param user - Module user. Contains a supply required by {@link Use.supply module use supply}. The module use
     * stops once the user supply is cut off.
     *
     * @returns A module usage instance.
     */
    use(user?: SupplyPeer): Use;

  }

  /**
   * An instance of the module use.
   *
   * The module is active while it is in use. I.e. at least one `Use` instance exists and active.
   *
   * The use is active util its {@link supply} is cut off.
   *
   * The module use instance can be used as its handle too.
   */
  export interface Use extends Handle, SupplyPeer {

    /**
     * An `AfterEvent` keeper of module load status.
     *
     * The `[AfterEvent__symbol]` property is an alias of this one.
     *
     * Cuts off the supply when context module no longer {@link supply used}.
     */
    readonly read: AfterEvent<[ContextModule.Status]>;

    /**
     * An `OnEvent` sender of the module settlement event.
     *
     * Sends the {@link ContextModule.Status loaded module status} when it is {@link ContextModule.Status.settled
     * settled}, but possibly before it is {@link ContextModule.Status.ready ready}.
     *
     * Cuts off the supply when context module {@link ContextModule.Status.error failed to load} or no longer
     * {@link supply used}.
     */
    readonly whenSettled: OnEvent<[ContextModule.Status]>;

    /**
     * An `OnEvent` sender of the module readiness event.
     *
     * Sends the {@link ContextModule.Status loaded module status} when it is {@link ContextModule.Status.ready ready
     * for use}.
     *
     * Cuts off the supply when context module {@link ContextModule.Status.error failed to load} or no longer
     * {@link supply used}.
     */
    readonly whenReady: OnEvent<[ContextModule.Status]>;

    /**
     * Module use supply.
     *
     * The module use stops once this supply is cut off.
     */
    readonly supply: Supply;

  }

  /**
   * Context module load status.
   *
   * This status is reported by {@link ContextModule.Handle loaded module handle}.
   */
  export interface Status {

    /**
     * Loaded module.
     *
     * Note that it may differ from the one requested to load. E.g. when another module {@link ContextModule.Options.has
     * provides} it.
     */
    readonly module: ContextModule;

    /**
     * Whether the module implementation is provided.
     */
    readonly provided: boolean;

    /**
     * Whether the module is {@link Handle.use used} at least once.
     */
    readonly used: boolean;

    /**
     * Whether the module is settled.
     *
     * The module is settled when its {@link ContextModule.setup set up} is complete.
     */
    readonly settled: boolean;

    /**
     * Whether the module is loaded and ready for use.
     *
     * The module is ready when it is {@link settled}, and all of its {@link ContextModule.Setup.initBy initializers}
     * succeed.
     */
    readonly ready: boolean;

    /**
     * Error occurred while loading the module.
     */
    readonly error?: unknown;

  }

}
