import { AfterEvent, EventKeeper, OnEvent } from '@proc7ts/fun-events';
import { lazyValue, valueProvider } from '@proc7ts/primitives';
import { Supply, SupplyPeer } from '@proc7ts/supply';
import { CxAsset, CxEntry, CxValues } from '../core';
import { CxModule$Impl, CxModule$Impl__symbol, CxModule$implement, CxModule$replace } from './module.impl';
import { CxModule$Usage } from './module.usage.impl';

/**
 * Context module.
 *
 * Modules intended to extend the context dynamically.
 *
 * The module is a context entry that can be used to provide module instance and access its
 * {@link CxModule.Handle handle}.
 *
 * Usage example:
 * ```typescript
 * // Construct new module.
 * const myModule = new CxModule('my module', {
 *   setup(setup) {
 *     // Provide the values
 *     setup.provide({ a: Foo, is: 'foo' });
 *   },
 * });
 *
 * // Load the module
 * const myModuleSupply = contextBuilder.provide(myModule);
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
export class CxModule implements CxEntry<CxModule.Handle, CxModule>, CxAsset<CxModule.Handle, CxModule> {

  /**
   * @internal
   */
  private readonly [CxModule$Impl__symbol]: CxModule$Impl;

  /**
   * Constructs context module.
   *
   * @param name - Human-readable module name.
   * @param options - Module construction options.
   */
  constructor(name: string, options: CxModule.Options = {}) {
    this[CxModule$Impl__symbol] = new CxModule$Impl(this, name, options);
  }

  /**
   * Human-readable module name.
   */
  get name(): string {
    return this[CxModule$Impl__symbol].name;
  }

  get [Symbol.toStringTag](): string {
    return this.name;
  }

  get entry(): this {
    return this;
  }

  /**
   * The modules this one requires.
   *
   * Assigned by {@link CxModule.Options.needs} option.
   */
  get needs(): ReadonlySet<CxModule> {
    return this[CxModule$Impl__symbol].needs;
  }

  /**
   * The modules this one provides.
   *
   * Assigned by {@link CxModule.Options.has} option.
   *
   * Always contains the module itself.
   */
  get has(): ReadonlySet<CxModule> {
    return this[CxModule$Impl__symbol].has;
  }

  perContext(target: CxEntry.Target<CxModule.Handle, CxModule>): CxEntry.Definition<CxModule.Handle> {

    const getUsageAndHandle = lazyValue<[CxModule$Usage, CxModule.Handle]>(() => {

      const usage = new CxModule$Usage(target.context, this);

      return [usage, usage.createHandle()];
    });
    let getHandle = (): CxModule.Handle => {

      const [usage, handle] = getUsageAndHandle();

      getHandle = valueProvider(handle); // Allow to receive handle before setup completes.

      // Set up only once.
      usage.setup(target);
      usage.implementBy(CxModule$implement(target));

      return handle;
    };

    return {
      assign(assigner) {
        assigner(getHandle());
      },
    };
  }

  placeAsset(
      _target: CxEntry.Target<CxModule.Handle, CxModule>,
      collector: CxAsset.Collector<CxModule>,
  ): void {
    collector(this);
  }

  setupAsset(target: CxEntry.Target<CxModule.Handle, CxModule>): void {
    for (const replaced of this.has) {
      if (replaced !== this && replaced !== target.entry) {
        target.provide(CxModule$replace(replaced, this));
      }
    }
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
   *    The dependency considered satisfied when it is {@link CxModule.Status.settled settled}.
   *
   * 2. {@link CxModule.Setup.initBy Initializes} the module by initializing the dependencies.
   *
   *    The dependency considered initialized when it is {@link CxModule.Status.ready ready for use}.
   *
   * 3. Performs the module setup by invoking the {@link CxModule.Options.setup} method.
   *
   * @param setup - Context module setup.
   *
   * @returns A promise resolved when the module is set up asynchronously.
   */
  setup(setup: CxModule.Setup): Promise<void> {
    return this[CxModule$Impl__symbol].setup(setup);
  }

  toString(): string {
    return `[CxModule ${this[Symbol.toStringTag]}]`;
  }

}

export namespace CxModule {

  /**
   * Context module construction options.
   */
  export interface Options {

    /**
     * A module or modules the constructed one requires.
     *
     * The listed modules will be loaded prior to loading the constructed one.
     */
    readonly needs?: CxModule | readonly CxModule[];

    /**
     * A module or modules the constructed one provides.
     *
     * When specified, the constructed module will be loaded _instead_ of the listed ones.
     *
     * The module always provides itself.
     */
    readonly has?: CxModule | readonly CxModule[];

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
    setup?(setup: CxModule.Setup): void | PromiseLike<unknown>;

  }

  /**
   * Context module setup.
   *
   * Passed to {@link CxModule.setup module setup method} in order to access and provide the necessary values.
   *
   * @typeParam TCtx - Target context type.
   */
  export interface Setup extends CxValues, CxValues.Modifier, SupplyPeer {

    /**
     * The module to set up.
     */
    readonly module: CxModule;

    /**
     * Module supply.
     *
     * This supply will be cut off once the module is unloaded.
     */
    readonly supply: Supply;

    /**
     * Provides assets for context {@link CxAsset.entry entry}.
     *
     * The asset will be revoked automatically once the module is unloaded.
     *
     * @param asset - Context entry asset.
     *
     * @returns Assets supply. Revokes provided assets once cut off.
     */
    provide<TValue, TAsset = TValue>(asset: CxAsset<TValue, TAsset>): Supply;

    /**
     * Registers the module initializer.
     *
     * The module initializer registration is only valid during its {@link CxModule.setup setup}.
     *
     * The registered initializers executed after successful module {@link CxModule.setup}. The modules
     * is considered {@link CxModule.Status.ready ready for use} only when all registered initializers succeed.
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
   * Available as module entry {@link CxValues.get value}.
   *
   * Implements an `EventKeeper` interface by sending a {@link CxModule.Status module load status} updates.
   */
  export interface Handle extends EventKeeper<[CxModule.Status]> {

    /**
     * An `AfterEvent` keeper of module load status.
     *
     * The `[AfterEvent__symbol]` property is an alias of this one.
     */
    readonly read: AfterEvent<[CxModule.Status]>;

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
    readonly read: AfterEvent<[CxModule.Status]>;

    /**
     * An `OnEvent` sender of the module settlement event.
     *
     * Sends the {@link CxModule.Status loaded module status} when it is {@link CxModule.Status.settled settled}, but
     * possibly before it is {@link CxModule.Status.ready ready}.
     *
     * Cuts off the supply when context module {@link CxModule.Status.error failed to load} or no longer
     * {@link supply used}.
     */
    readonly whenSettled: OnEvent<[CxModule.Status]>;

    /**
     * An `OnEvent` sender of the module readiness event.
     *
     * Sends the {@link CxModule.Status loaded module status} when it is {@link CxModule.Status.ready ready
     * for use}.
     *
     * Cuts off the supply when context module {@link CxModule.Status.error failed to load} or no longer
     * {@link supply used}.
     */
    readonly whenReady: OnEvent<[CxModule.Status]>;

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
   * This status is reported by {@link CxModule.Handle loaded module handle}.
   */
  export interface Status {

    /**
     * Loaded module.
     *
     * Note that it may differ from the one requested to load. E.g. when another module {@link CxModule.Options.has
     * provides} it.
     */
    readonly module: CxModule;

    /**
     * Whether the module implementation provided.
     */
    readonly provided: boolean;

    /**
     * Whether the module is {@link Handle.use used} at least once.
     */
    readonly used: boolean;

    /**
     * Whether the module settled.
     *
     * The module is settled when its {@link CxModule.setup set up} is complete.
     */
    readonly settled: boolean;

    /**
     * Whether the module loaded and ready for use.
     *
     * The module is ready when it is {@link settled}, and all of its {@link CxModule.Setup.initBy initializers}
     * succeed.
     */
    readonly ready: boolean;

    /**
     * Error occurred while loading the module.
     */
    readonly error?: unknown;

  }

}
