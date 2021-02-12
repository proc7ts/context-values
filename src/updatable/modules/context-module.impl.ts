import type { OnEvent } from '@proc7ts/fun-events';
import { isDefined, noop, setOfElements, Supply, valueProvider } from '@proc7ts/primitives';
import { itsElements, valueIt } from '@proc7ts/push-iterator';
import type { ContextRegistry } from '../../registry';
import type { ContextUpKey } from '../context-up-key';
import type { ContextModule } from './context-module';
import { ContextModuleDependencyError } from './context-module-dependency-error';
import { ContextModuleKey } from './context-module-key.impl';

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

    const deps = contextModuleDeps(setup);

    // Await for module dependencies to be settled.
    if (!await loadContextModuleDeps(setup, deps, whenContextModuleSettled)) {
      return;
    }

    setup.initBy(async () => {
      // Initialize module dependencies.
      await loadContextModuleDeps(setup, deps, whenContextModuleReady);
    });

    await this._setup(setup);
  }

}

interface ContextModuleDep {
  readonly dep: ContextModule;
  readonly use: ContextModule.Use;
}

function contextModuleDeps(setup: ContextModule.Setup): readonly ContextModuleDep[] {

  const { module, supply } = setup;

  return itsElements(
      valueIt(
          module.needs,
          dep => dep !== module
              && setup.provide(dep).needs(supply)
              && {
                dep,
                use: setup.get(dep).use(setup),
              },
      ),
  );
}

function loadContextModuleDeps(
    setup: ContextModule.Setup,
    deps: readonly ContextModuleDep[],
    whenLoaded: (use: ContextModule.Use) => OnEvent<[ContextModule.Status]>,
): Promise<boolean> {

  const { module, supply } = setup;
  const notLoaded = valueProvider(false);
  const whenDone = supply.whenDone().then(notLoaded, notLoaded);

  return Promise.race([
    whenDone,
    Promise
        .all(
            deps
                .map(
                    ({ dep, use }) => whenLoaded(use).then(
                        noop,
                        error => [dep, error] as const,
                    ),
                ),
        )
        .then(
            (results): true | ContextModuleDependencyError => {

              const failures = results.filter<readonly [ContextModule, unknown]>(isDefined);

              return failures.length
                  ? new ContextModuleDependencyError(module, failures) // Prevent unhandled promise rejection
                  : true as const;
            },
        ),
  ]).then(
      result => {
        if (typeof result !== 'boolean') {
          // Fail to load module if at leas one of its dependencies failed.
          return Promise.reject(result);
        }

        return result;
      },
  );
}

function whenContextModuleSettled(use: ContextModule.Use): OnEvent<[ContextModule.Status]> {
  return use.whenSettled;
}

function whenContextModuleReady(use: ContextModule.Use): OnEvent<[ContextModule.Status]> {
  return use.whenReady;
}
