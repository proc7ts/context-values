/**
 * @packageDocumentation
 * @module @proc7ts/fun-events/updatable
 */
import { asis, isUndefined, noop, setOfElements, Supply, valueProvider } from '@proc7ts/primitives';
import { itsElements, mapIt, valueIt } from '@proc7ts/push-iterator';
import { ContextBuilder, ContextBuilder__symbol } from '../../context-builder';
import { ContextKey__symbol } from '../../context-key';
import type { ContextRegistry } from '../../context-registry';
import type { ContextUpKey, ContextUpRef } from '../context-up-key';
import type { ContextModuleHandle } from './context-module-handle';
import { ContextModuleKey } from './context-module-key.impl';
import type { ContextModuleOptions } from './context-module-options';
import type { ContextModuleSetup } from './context-module-setup';

/**
 * @internal
 */
const ContextModule_setup__symbol = (/*#__PURE__*/ Symbol('ContextModule.setup'));

/**
 * @internal
 */
const ContextModule_replace__symbol = (/*#__PURE__*/ Symbol('ContextModule.replace'));

/**
 * Context module.
 *
 * Modules intended to extend the context dynamically.
 *
 * The module is a context value reference that can be used to provide module instance and access its
 * {@link ContextModuleHandle handle}.
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
 * // Await for the module to load
 * await context.get(myModule).whenReady;
 *
 * // Access the value provided by module.
 * console.log(context.get(Foo));
 *
 * // Unload the module.
 * myModuleSupply.off();
 * ```
 */
export class ContextModule implements ContextUpRef<ContextModuleHandle, ContextModule>, ContextBuilder {

  /**
   * A key of context module.
   */
  readonly [ContextKey__symbol]: ContextUpKey<ContextModuleHandle, ContextModule>;

  /**
   * Human-readable module name.
   */
  readonly name: string;

  /**
   * The module this one is an alias of.
   *
   * Assigned by {@link ContextModuleOptions.aliasOf} option.
   */
  readonly aliasOf: ContextModule;

  /**
   * The modules this one requires.
   *
   * Assigned by {@link ContextModuleOptions.needs} option.
   */
  readonly needs: ReadonlySet<ContextModule>;

  /**
   * The modules this one provides.
   *
   * Assigned by {@link ContextModuleOptions.has} option.
   *
   * Always contains the module itself.
   */
  readonly has: ReadonlySet<ContextModule>;

  /**
   * @internal
   */
  private readonly [ContextModule_setup__symbol]: (
      this: void,
      setup: ContextModuleSetup,
  ) => void | PromiseLike<unknown>;

  private readonly [ContextModule_replace__symbol]: readonly (readonly [
    replaced: ContextModule,
    replacement: ContextModule,
  ])[];

  /**
   * Constructs context module.
   *
   * @param name - Human-readable module name.
   * @param options - Module construction options.
   */
  constructor(name: string, options: ContextModuleOptions = {}) {
    this[ContextKey__symbol] = new ContextModuleKey(`${name}:module`, this);
    this.name = name;

    const { aliasOf, needs, has, setup } = options;

    this.aliasOf = aliasOf ? aliasOf.aliasOf : this;
    this.needs = setOfElements(needs);

    const replaced = setOfElements(has);

    this[ContextModule_setup__symbol] = setup ? setup.bind(options) : noop;
    this[ContextModule_replace__symbol] = itsElements(valueIt(replaced, replaced => {
      if (replaced === this) {
        return;
      }

      return [
        replaced,
        new ContextModule(
            `${replaced.name}->${this.name}`,
            {
              aliasOf: this,
              setup: setup => setup.get(this).whenReady,
            },
        ),
      ];
    }));

    this.has = replaced.add(this);
  }

  /**
   * Provides this module and {@link has module replacements}.
   */
  [ContextBuilder__symbol](registry: ContextRegistry): Supply {

    const supply = registry.provide({ a: this, is: this });

    for (const [replaced, replacement] of this[ContextModule_replace__symbol]) {
      registry.provide({ a: replaced, is: replacement }).needs(supply);
    }

    return supply;
  }

  /**
   * Sets up the module.
   *
   * This method is called when loading the module. It is used e.g. to provide more values for the context.
   *
   * By default:
   * - satisfies module {@link needs dependencies},
   * - performs the set up procedure by {@link ContextModuleOptions.setup} option.
   *
   * @param setup - Context module setup.
   *
   * @returns A promise resolved when the module is set up asynchronously.
   */
  async setup(setup: ContextModuleSetup): Promise<void> {
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
function satisfyContextModuleDeps(setup: ContextModuleSetup): Promise<boolean> {

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
    setup: ContextModuleSetup,
    modules: Iterable<ContextModule>,
): Promise<boolean> {

  const { supply } = setup;
  const whenDone = supply.whenDone().then(valueProvider(false));

  return Promise
      .all(
          mapIt(
              modules,
              module => Promise.race([
                setup.get(module).whenReady.then(valueProvider(true), isUndefined),
                whenDone,
              ]),
          ),
      )
      .then(
          results => results.every(asis),
          valueProvider(false),
      );
}
