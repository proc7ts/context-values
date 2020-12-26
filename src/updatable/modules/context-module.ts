/**
 * @packageDocumentation
 * @module @proc7ts/fun-events/updatable
 */
import { asis, isUndefined, noop, setOfElements, valueProvider } from '@proc7ts/primitives';
import { mapIt, valueIt } from '@proc7ts/push-iterator';
import { ContextKey__symbol } from '../../context-key';
import type { ContextValueSpec } from '../../context-value-spec';
import { ContextValueSpec__symbol } from '../../context-value-spec';
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
export class ContextModule implements ContextUpRef<ContextModuleHandle, ContextModule> {

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
   * Assigned by {@link ContextModuleOptions.aliases} option.
   */
  readonly aliases: ContextModule;

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
  private readonly [ContextModule_setup__symbol]: (this: void, setup: ContextModuleSetup) => void | PromiseLike<void>;

  /**
   * Constructs context module.
   *
   * @param name - Human-readable module name.
   * @param options - Module construction options.
   */
  constructor(name: string, options: ContextModuleOptions = {}) {
    this[ContextKey__symbol] = new ContextModuleKey(`${name}:module`, this);
    this.name = name;

    const { aliases, needs, has, setup } = options;

    this.aliases = aliases ? aliases.aliases : this;
    this.needs = setOfElements(needs);
    this.has = setOfElements(has).add(this);
    this[ContextModule_setup__symbol] = setup ? setup.bind(options) : noop;
  }

  /**
   * Context value specifier that provides this module instance.
   */
  get [ContextValueSpec__symbol](): ContextValueSpec.IsConstant<this> {
    return {
      a: this,
      is: this,
    };
  }

  /**
   * Sets up the module.
   *
   * This method is called when loading the module. It is used e.g. to provide more values for the context.
   *
   * By default:
   * - satisfies module {@link needs dependencies},
   * - provides {@link has module replacements},
   * - performs the set up by {@link ContextModuleOptions.setup} option.
   *
   * @param setup - Context module setup.
   *
   * @returns A promise resolved when the module is set up asynchronously.
   */
  async setup(setup: ContextModuleSetup): Promise<void> {
    replaceContextModules(setup);
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
function replaceContextModules(setup: ContextModuleSetup): void {

  const { module } = setup;

  for (const replaced of module.has) {
    if (replaced === module) {
      continue; // Do not replace itself.
    }

    const replacement = new ContextModule(`${replaced.name}->${module.name}`, { aliases: module });

    setup.provide({ a: replaced, is: replacement }).needs(setup);
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
