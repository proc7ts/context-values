import type { OnEvent } from '@proc7ts/fun-events';
import { AfterEvent, afterEventBy, sendEventsTo } from '@proc7ts/fun-events';
import { isDefined, noop, setOfElements, valueProvider } from '@proc7ts/primitives';
import { itsElements, valueIt } from '@proc7ts/push-iterator';
import { CxAsset, CxEntry } from '../core';
import { CxDependencyError } from './dependency-error';
import type { CxModule } from './module';

export const CxModule$Impl__symbol = (/*#__PURE__*/ Symbol('ContextModule.impl'));

export class CxModule$Impl {

  readonly has: ReadonlySet<CxModule>;
  readonly needs: ReadonlySet<CxModule>;

  private readonly _setup: (
      this: void,
      setup: CxModule.Setup,
  ) => void | PromiseLike<unknown>;

  constructor(readonly module: CxModule, readonly name: string, readonly options: CxModule.Options) {

    const { needs, has, setup } = options;

    this.has = setOfElements(has).add(module);
    this.needs = setOfElements(needs);
    this._setup = setup ? setup.bind(options) : noop;
  }

  async setup(setup: CxModule.Setup): Promise<void> {

    const deps = CxModule$deps(setup);

    // Await for module dependencies to be settled.
    if (!await CxModule$loadDeps(setup, deps, CxModule$whenSettled)) {
      return;
    }

    setup.initBy(async () => {
      // Initialize module dependencies.
      await CxModule$loadDeps(setup, deps, CxModule$whenReady);
    });

    await this._setup(setup);
  }

}

export function CxModule$replace(replaced: CxModule, replacement: CxModule): CxAsset<CxModule.Handle, CxModule> {
  return {
    entry: replaced,
    placeAsset(_target, collector) {
      collector(replacement);
    },
  };
}

export function CxModule$implement(
    target: CxEntry.Target<CxModule.Handle, CxModule>,
): AfterEvent<[CxModule | undefined]> {

  const module = target.entry;

  return afterEventBy<[CxModule | undefined]>(receiver => {

    const receive = sendEventsTo(receiver);

    target.trackAssetList(candidates => {

      let impl: CxModule | undefined;

      for (let i = candidates.length - 1; i >= 0; --i) {

        const recent = candidates[i].recentAsset;

        if (recent) {
          impl = recent.asset;
          if (impl !== module) {
            break;
          }
        }
      }

      receive(impl);
    }).needs(receiver.supply);
  });
}

interface CxModule$Dep {
  readonly dep: CxModule;
  readonly use: CxModule.Use;
}

function CxModule$deps(setup: CxModule.Setup): readonly CxModule$Dep[] {

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

function CxModule$loadDeps(
    setup: CxModule.Setup,
    deps: readonly CxModule$Dep[],
    whenLoaded: (use: CxModule.Use) => OnEvent<[CxModule.Status]>,
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
            (results): true | CxDependencyError => {

              const failures = results.filter<readonly [CxModule, unknown]>(isDefined);

              return failures.length
                  ? new CxDependencyError(module, failures) // Prevent unhandled promise rejection
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

function CxModule$whenSettled(use: CxModule.Use): OnEvent<[CxModule.Status]> {
  return use.whenSettled;
}

function CxModule$whenReady(use: CxModule.Use): OnEvent<[CxModule.Status]> {
  return use.whenReady;
}
