import type { AfterEvent, EventKeeper } from '@proc7ts/fun-events';
import { mapAfter_, onceOn, trackValue, trackValueBy, valueOn_, ValueTracker } from '@proc7ts/fun-events';
import { alwaysSupply, neverSupply, noop, Supply } from '@proc7ts/primitives';
import type { ContextValueSlot } from '../../context-key';
import type { ContextRequest } from '../../context-ref';
import type { ContextRegistry } from '../../context-registry';
import { ContextSupply } from '../../context-supply';
import type { ContextValues } from '../../context-values';
import { ContextUpKey } from '../context-up-key';
import type { ContextModule } from './context-module';
import { ContextModuleHandle } from './context-module-handle';
import type { ContextModuleStatus } from './context-module-status';

/**
 * @internal
 */
export class ContextModuleKey extends ContextUpKey<ContextModuleHandle, ContextModule> {

  constructor(name: string, private readonly _module: ContextModule) {
    super(name);
  }

  get upKey(): this {
    return this;
  }

  grow(
      slot: ContextValueSlot<
          ContextModuleHandle,
          EventKeeper<ContextModule[]> | ContextModule,
          AfterEvent<ContextModule[]>>,
  ): void {

    const [handle, setup] = createContextModuleHandle(
        slot.context,
        this._module,
        slot.seed,
    );

    slot.insert(handle);
    slot.setup(({ context, registry }) => setup(context, registry));
  }

}

/**
 * @internal
 */
function createContextModuleHandle(
    context: ContextValues,
    module: ContextModule,
    impls: AfterEvent<[ContextModule]>,
): [handle: ContextModuleHandle, setup: (context: ContextValues, registry: ContextRegistry) => void] {

  const contextSupply = context.get(ContextSupply, { or: alwaysSupply() });
  const impl = trackValueBy(implementContextModule(module, impls));

  contextSupply.cuts(impl);

  const loader = trackValue<ContextModuleLoader>({
    status: {
      module: module.aliases,
      ready: false,
    },
    supply: neverSupply(),
  });

  contextSupply.cuts(loader);

  return [
    newContextModuleHandle(loader.read),
    newContextModuleSetup(impl.read, loader),
  ];
}

/**
 * @internal
 */
function implementContextModule(
    module: ContextModule,
    impls: AfterEvent<[ContextModule]>,
): AfterEvent<[ContextModule | undefined]> {
  return impls.do(
      mapAfter_((...candidates) => {

        let impl: ContextModule | undefined;

        for (let i = candidates.length - 1; i >= 0; --i) {
          impl = candidates[i];
          if (impl !== module) {
            break;
          }
        }

        return impl;
      }),
  );
}

/**
 * @internal
 */
interface ContextModuleLoader {

  readonly status: ContextModuleStatus;
  readonly supply: Supply;

}

/**
 * @internal
 */
function newContextModuleHandle(loader: AfterEvent<[ContextModuleLoader]>): ContextModuleHandle {

  class ContextModuleHandle$ extends ContextModuleHandle {

    readonly read = loader.do(
        mapAfter_(({ status }) => status),
    );

    readonly whenReady = loader.do(
        valueOn_(({ status: { module, ready } }) => ready && module),
        onceOn,
    );

  }

  return new ContextModuleHandle$();
}

/**
 * @internal
 */
function newContextModuleSetup(
    impl: AfterEvent<[ContextModule?]>,
    loader: ValueTracker<ContextModuleLoader>,
): (context: ContextValues, registry: ContextRegistry) => void {

  let setup: (context: ContextValues, registry: ContextRegistry) => void = noop;
  let updateSetup = (newSetup: (context: ContextValues, registry: ContextRegistry) => void): void => {
    setup = newSetup;
  };

  impl(module => {

    const prevSupply = loader.it.supply;

    if (module) {
      updateSetup(loadContextModule(module, loader));
    } else {
      updateSetup(noop);
    }

    prevSupply.off();
  });

  return (context, registry) => {
    updateSetup = newSetup => newSetup(context, registry);
    setup(context, registry);
  };
}

/**
 * @internal
 */
function loadContextModule(
    module: ContextModule,
    tracker: ValueTracker<ContextModuleLoader>,
): (context: ContextValues, registry: ContextRegistry) => void {

  const supply = new Supply().needs(tracker);
  const loader: ContextModuleLoader = {
    status: {
      module: module.aliases,
      ready: false,
    },
    supply,
  };

  tracker.it = loader;

  const updateStatus = (ready: boolean): void => {
    if (tracker.it !== loader) {
      supply.off();
    } else {
      tracker.it = {
        status: {
          module: module.aliases,
          ready,
        },
        supply,
      };
    }
  };

  return (context, registry) => {
    setupContextModule(context, registry, module, supply)
        .then(() => updateStatus(true))
        .catch(error => {
          supply.off(error);
          updateStatus(false);
        });
  };
}

/**
 * @internal
 */
async function setupContextModule(
    context: ContextValues,
    registry: ContextRegistry,
    module: ContextModule,
    supply: Supply,
): Promise<void> {
  await module.setup({
    module,
    supply,
    get(request: ContextRequest<any>) {
      return context.get(request);
    },
    provide(spec): Supply {
      return registry.provide(spec).needs(supply);
    },
  });
}


