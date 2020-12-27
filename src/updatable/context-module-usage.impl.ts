import {
  AfterEvent,
  AfterEvent__symbol,
  mapAfter_,
  onceOn,
  trackValue,
  valueOn_,
  ValueTracker,
} from '@proc7ts/fun-events';
import { alwaysSupply, neverSupply, Supply, SupplyPeer, valueProvider } from '@proc7ts/primitives';
import type { ContextRequest } from '../context-ref';
import type { ContextRegistry } from '../context-registry';
import { ContextSupply } from '../context-supply';
import type { ContextValues } from '../context-values';
import type { ContextModule } from './context-module';

/**
 * @internal
 */
export class ContextModuleUsage {

  private readonly _impl: ValueTracker<ContextModule| undefined>;
  private readonly _loader: ValueTracker<ContextModuleLoader>;

  private _setup: () => void = () => {
    this._updateSetup = setup => setup();
  };

  private _updateSetup = (setup: () => void): void => {
    this._setup = setup;
  };

  private _useCounter = 0;

  constructor(context: ContextValues, readonly module: ContextModule) {
    this._impl = trackValue();
    this._loader = trackValue<ContextModuleLoader>({
      status: {
        module: module.aliasOf,
        ready: false,
      },
      supply: neverSupply(),
    });

    const contextSupply = context.get(ContextSupply, { or: alwaysSupply() });

    contextSupply.cuts(this._impl);
    contextSupply.cuts(this._loader);

    this._impl.read(module => {

      const prevSupply = this._loader.it.supply;

      if (module) {
        this._load(module);
      }

      prevSupply.off();
    });
  }

  createHandle(): ContextModule.Handle {

    const read: AfterEvent<[ContextModule.Status]> = this._loader.read.do(
        mapAfter_(({ status }) => status),
    );

    const handle: ContextModule.Handle = {
      read,
      [AfterEvent__symbol]: valueProvider(read),
      use: (user?: SupplyPeer) => this._use(handle, user),
    };

    return handle;
  }

  setup(context: ContextValues, registry: ContextRegistry): void {
    this._updateSetup(() => {

      const loader = this._loader.it;
      const updateStatus = (ready: boolean): void => {
        if (this._loader.it !== loader) {
          loader.supply.off();
        } else {
          this._loader.it = {
            status: {
              module: loader.status.module.aliasOf,
              ready,
            },
            supply: loader.supply,
          };
        }
      };

      setupContextModule(context, registry, loader)
          .then(() => updateStatus(true))
          .catch(error => {
            loader.supply.off(error);
            updateStatus(false);
          });
    });
  }

  implementBy(impl: AfterEvent<[ContextModule?]>): void {
    this._impl.by(impl);
  }

  private _use(handle: ContextModule.Handle, user?: SupplyPeer): ContextModule.Use {

    const supply = user ? user.supply : new Supply();
    const use: ContextModule.Use = {
      ...handle,
      whenReady: handle.read.do(
          valueOn_(status => status.ready && status),
          onceOn,
      ),
      supply,
    };

    if (!supply.isOff) {
      supply.whenOff(reason => {
        if (!--this._useCounter) {
          this._loader.it.supply.off(reason);
        }
      });

      if (!this._useCounter++) {
        // Setup module
        this._setup();
      }
    }

    return use;
  }

  private _load(module: ContextModule): void {

    const supply = new Supply().needs(this._loader);

    this._loader.it = {
      status: {
        module: module.aliasOf,
        ready: false,
      },
      supply,
    };

    if (this._useCounter) {
      this._setup();
    }
  }

}

/**
 * @internal
 */
interface ContextModuleLoader {

  readonly status: ContextModule.Status;
  readonly supply: Supply;

}

/**
 * @internal
 */
async function setupContextModule(
    context: ContextValues,
    registry: ContextRegistry,
    { status: { module }, supply }: ContextModuleLoader,
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
