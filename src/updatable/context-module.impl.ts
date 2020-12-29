import { isDefined, noop, setOfElements, Supply, valueProvider } from '@proc7ts/primitives';
import { mapIt, valueIt } from '@proc7ts/push-iterator';
import type { ContextRegistry } from '../context-registry';
import type { ContextModule } from './context-module';
import { ContextModuleDependencyError } from './context-module-dependency-error';
import { ContextModuleKey } from './context-module-key.impl';
import type { ContextUpKey } from './context-up-key';

/**
 * @internal
 */
export const ContextModule$impl__symbol = (/*#__PURE__*/ Symbol('ContextModule.impl'));

/**
 * @internal
 */
export class ContextModule$ {

  readonly key: ContextUpKey<ContextModule.Handle, ContextModule>;
  readonly has: ReadonlySet<ContextModule>;
  readonly needs: ReadonlySet<ContextModule>;

  private readonly _setup: (
      this: void,
      setup: ContextModule.Setup,
  ) => void | PromiseLike<unknown>;

  constructor(module: ContextModule, readonly name: string, readonly options: ContextModule.Options) {
    this.key = new ContextModuleKey(`${name}:module`, module);

    const { needs, has, setup } = options;

    this.has = setOfElements(has).add(module);
    this.needs = setOfElements(needs);
    this._setup = setup ? setup.bind(options) : noop;
  }

  replace(
      module: ContextModule,
      registry: ContextRegistry,
      supply: Supply,
  ): void {
    for (const replaced of module.has) {
      if (replaced !== module) {
        registry.provide({ a: replaced, is: module }).needs(supply);
      }
    }
  }

  async setup(setup: ContextModule.Setup): Promise<void> {
    if (!await satisfyContextModuleDeps(setup)) {
      setup.supply.off();
      return;
    }
    await this._setup(setup);
  }

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
          dep => dep !== module && setup.provide(dep).needs(supply) && dep,
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

  const { module, supply } = setup;
  const notLoaded = valueProvider(false);
  const whenDone = supply.whenDone().then(notLoaded, notLoaded);

  return Promise.race([
    whenDone,
    Promise
        .all(
            mapIt(
                modules,
                dep => setup.get(dep)
                    .use(setup)
                    .whenReady
                    .then(
                        noop,
                        error => [dep, error] as const,
                    ),
            ),
        )
        .then(
            reasons => {

              const knownReasons = reasons.filter<readonly [ContextModule, unknown]>(isDefined);

              return knownReasons.length
                  ? new ContextModuleDependencyError(module, knownReasons) // Prevent unhandled promise rejection
                  : true;
            },
        ),
  ]).then(
      result => typeof result === 'boolean'
          ? result
          : Promise.reject(result),
  );
}

