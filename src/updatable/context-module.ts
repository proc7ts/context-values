/**
 * @packageDocumentation
 * @module @proc7ts/fun-events/updatable
 */
import type { AfterEvent, EventKeeper, OnEvent } from '@proc7ts/fun-events';
import { asis, isUndefined, noop, setOfElements, Supply, SupplyPeer, valueProvider } from '@proc7ts/primitives';
import { itsElements, mapIt, valueIt } from '@proc7ts/push-iterator';
import { ContextBuilder, ContextBuilder__symbol } from '../context-builder';
import { ContextKey__symbol } from '../context-key';
import type { ContextRegistry } from '../context-registry';
import type { ContextValueSpec } from '../context-value-spec';
import type { ContextValues } from '../context-values';
import { ContextModuleKey } from './context-module-key.impl';
import type { ContextUpKey, ContextUpRef } from './context-up-key';

/**
 * @internal
 */
const ContextModule_setup__symbol = (/*#__PURE__*/ Symbol('ContextModule.setup'));

/**
 * @internal
 */
const ContextModuleReplacer__symbol = (/*#__PURE__*/ Symbol('ContextModuleReplacer'));

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
 * const myModule = new Module('my-module', {
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
   * A key of context module.
   */
  readonly [ContextKey__symbol]: ContextUpKey<ContextModule.Handle, ContextModule>;

  /**
   * Human-readable module name.
   */
  readonly name: string;

  /**
   * The module this one is an alias of.
   *
   * Assigned by {@link ContextModule.Options.aliasOf} option.
   */
  readonly aliasOf: ContextModule;

  /**
   * The modules this one requires.
   *
   * Assigned by {@link ContextModule.Options.needs} option.
   */
  readonly needs: ReadonlySet<ContextModule>;

  /**
   * The modules this one provides.
   *
   * Assigned by {@link ContextModule.Options.has} option.
   *
   * Always contains the module itself.
   */
  readonly has: ReadonlySet<ContextModule>;

  /**
   * @internal
   */
  private readonly [ContextModule_setup__symbol]: (
      this: void,
      setup: ContextModule.Setup,
  ) => void | PromiseLike<unknown>;

  private readonly [ContextModuleReplacer__symbol]: ContextModuleReplacer;

  /**
   * Constructs context module.
   *
   * @param name - Human-readable module name.
   * @param options - Module construction options.
   */
  constructor(name: string, options: ContextModule.Options = {}) {
    this[ContextKey__symbol] = new ContextModuleKey(`${name}:module`, this);
    this.name = name;

    const { aliasOf, needs, has, setup } = options;

    this.aliasOf = aliasOf ? aliasOf.aliasOf : this;
    this.needs = setOfElements(needs);

    const replaced = setOfElements(has);

    this[ContextModule_setup__symbol] = setup ? setup.bind(options) : noop;
    this[ContextModuleReplacer__symbol] = contextModuleReplacer(this, replaced);

    this.has = replaced.add(this);
  }

  /**
   * Provides this module and {@link has module replacements}.
   */
  [ContextBuilder__symbol](registry: ContextRegistry): Supply {

    const supply = registry.provide({ a: this, is: this });

    this[ContextModuleReplacer__symbol](registry, supply);

    return supply;
  }

  /**
   * Sets up the module.
   *
   * This method is called when loading the module. It is used e.g. to provide more values for the context.
   *
   * By default:
   * - satisfies module {@link needs dependencies},
   * - performs the set up procedure by {@link ContextModule.Options.setup} option.
   *
   * @param setup - Context module setup.
   *
   * @returns A promise resolved when the module is set up asynchronously.
   */
  async setup(setup: ContextModule.Setup): Promise<void> {
    if (!await satisfyContextModuleDeps(setup)) {
      setup.supply.off();
      return;
    }
    await this[ContextModule_setup__symbol](setup);
  }

  toString(): string {
    return `ContextModule(${this.name})`;
  }

}

/**
 * @internal
 */
type ContextModuleReplacer = (registry: ContextRegistry, supply: Supply) => void;

/**
 * @internal
 */
function contextModuleReplacer(
    module: ContextModule,
    replaced: ReadonlySet<ContextModule>,
): ContextModuleReplacer {

  const replacements: [
    replaced: ContextModule,
    replacement: ContextModule,
  ][] = itsElements(valueIt(replaced, replaced => {
    if (replaced === module) {
      return;
    }

    return [
      replaced,
      new ContextModule(
          `${replaced.name}->${module.name}`,
          {
            aliasOf: module,
            setup: setup => setup.get(module).use(setup).whenReady,
          },
      ),
    ];
  }));

  return (registry, supply) => {
    for (const [replaced, replacement] of replacements) {
      registry.provide({ a: replaced, is: replacement }).needs(supply);
    }
  };
}

/**
 * @internal
 */
function satisfyContextModuleDeps(setup: ContextModule.Setup): Promise<boolean> {

  const { module, supply } = setup;

  return loadContextModules(
      setup,
      valueIt(
          module.needs,
          dep => {
            if (dep === module) {
              return; // Do not load itself.
            }

            setup.provide(dep).needs(supply);

            return dep;
          },
      ),
  );
}

/**
 * @internal
 */
function loadContextModules(
    setup: ContextModule.Setup,
    modules: Iterable<ContextModule>,
): Promise<boolean> {

  const { supply } = setup;
  const whenDone = supply.whenDone().then(valueProvider(false));

  return Promise
      .all(
          mapIt(
              modules,
              module => Promise.race([
                setup.get(module)
                    .use(setup)
                    .whenReady
                    .then(valueProvider(true), isUndefined),
                whenDone,
              ]),
          ),
      )
      .then(
          results => results.every(asis),
          valueProvider(false),
      );
}

export namespace ContextModule {

  /**
   * Context module construction options.
   */
  export interface Options {

    /**
     * The module the constructed one aliases.
     *
     * The aliased module is {@link ContextModule.Status.module reported} when constructed module loaded.
     *
     * This is useful to report a module replacement.
     *
     * @defaultValue The module itself.
     */
    readonly aliasOf?: ContextModule;

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
     * @param user - Module user. Contains a module {@link Use.supply use supply}. A new supply instance will be created
     * when omitted.
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
     */
    readonly read: AfterEvent<[ContextModule.Status]>;

    /**
     * An `OnEvent` sender of the module readiness event.
     *
     * Sends the {@link ContextModule.Status loaded module status} when it is {@link ContextModule.Status.ready ready
     * for use}.
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
     * Whether the module is loaded and ready for use.
     */
    readonly ready: boolean;

  }

}
