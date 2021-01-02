import {
  AfterEvent,
  AfterEvent__symbol,
  mapAfter_,
  OnEvent,
  onEventBy,
  trackValue,
  ValueTracker,
} from '@proc7ts/fun-events';
import { neverSupply, Supply, SupplyPeer, valueProvider } from '@proc7ts/primitives';
import type { ContextRequest } from '../context-ref';
import type { ContextRegistry } from '../context-registry';
import { ContextSupply } from '../context-supply';
import type { ContextValues } from '../context-values';
import type { ContextModule } from './context-module';
import { ContextModuleLoader } from './context-module-loader';

/**
 * @internal
 */
export class ContextModuleUsage {

  private readonly _impl: ValueTracker<ContextModule | undefined>;
  private readonly _rev: ValueTracker<ContextModuleRev>;
  private _useCounter = 0;

  private _setup!: () => void;

  constructor(context: ContextValues, readonly module: ContextModule) {
    this._impl = trackValue();
    this._rev = trackValue({
      status: {
        module: this.module,
        provided: false,
        used: false,
        ready: false,
      },
      supply: neverSupply(),
    });

    const contextSupply = context.get(ContextSupply);

    contextSupply.cuts(this._impl);
    contextSupply.cuts(this._rev);

    this._impl.read(module => {

      const prevSupply = this._rev.it.supply;

      if (module) {
        this._load(module);
      }

      prevSupply.off();
    });
  }

  createHandle(): ContextModule.Handle {

    const read: AfterEvent<[ContextModule.Status]> = this._rev.read.do(
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

    const loader = context.get(ContextModuleLoader);

    this._setup = () => {

      let rev = this._rev.it;
      const { status: { module }, supply } = rev;

      if (module !== this.module) {
        // Load implementation module instead.
        // The implementation module expected to be provided already.
        context.get(module).use(supply).read({
          supply,
          receive: (_ctx, { ready, error }) => {
            rev = this._updateStatus(rev, ready, error);
          },
        });
      } else {
        loadContextModule(context, registry, loader, rev)
            .then(() => this._updateStatus(rev, true))
            .catch(error => rev.supply.off(error));
      }
    };
  }

  implementBy(impl: AfterEvent<[ContextModule?]>): void {
    this._impl.by(impl);
  }

  private _updateStatus(
      rev: ContextModuleRev,
      ready: boolean,
      error?: unknown,
  ): ContextModuleRev {
    // Ensure updating the correct revision.
    if (this._rev.it.supply !== rev.supply) {
      // If revision changed, then drop the obsolete one.
      rev.supply.off();
    } else {
      this._rev.it = rev = {
        status: {
          module: rev.status.module,
          provided: rev.status.provided,
          used: true,
          ready,
          error,
        },
        supply: rev.supply,
      };
    }

    return rev;
  }

  private _use(handle: ContextModule.Handle, user?: SupplyPeer): ContextModule.Use {

    const supply = user ? user.supply : new Supply();
    const use: ContextModule.Use = {
      ...handle,
      whenReady: ContextModule$Use$whenReady(handle.read),
      supply,
    };

    if (!supply.isOff) {
      supply.whenOff(error => {
        if (!--this._useCounter) {

          const rev = this._rev.it;

          this._rev.it = {
            status: {
              ...rev.status,
              used: false,
              ready: false,
              error,
            },
            supply: new Supply().off(error),
          };

          rev.supply.off(error);
        }
      });

      if (!this._useCounter++) {
        // Mark the module used and set it up.

        const rev = this._rev.it;

        this._rev.it = {
          status: {
            ...rev.status,
            used: true,
          },
          supply: rev.supply,
        };

        this._setup();
      }
    }

    return use;
  }

  private _load(module: ContextModule): void {

    const supply = new Supply().needs(this._rev).whenOff(error => {

      const rev = this._rev.it;

      if (rev.supply === supply) {
        this._rev.it = {
          status: {
            ...this._rev.it.status,
            provided: false,
            ready: false,
            error,
          },
          supply,
        };
      }
    });

    const used = !!this._useCounter;

    this._rev.it = {
      status: {
        module,
        provided: true,
        used,
        ready: false,
      },
      supply,
    };

    if (used) {
      this._setup();
    }
  }

}

/**
 * @internal
 */
interface ContextModuleRev {

  readonly status: ContextModule.Status;
  readonly supply: Supply;

}

/**
 * @internal
 */
async function loadContextModule(
    context: ContextValues,
    registry: ContextRegistry,
    loader: ContextModuleLoader,
    { status: { module }, supply }: ContextModuleRev,
): Promise<void> {
  await loader.loadModule({

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

/**
 * @internal
 */
function ContextModule$Use$whenReady(status: AfterEvent<[ContextModule.Status]>): OnEvent<[ContextModule.Status]> {
  return onEventBy(receiver => status({
    supply: receiver.supply,
    receive: (context, status) => {
      if (status.ready) {
        receiver.receive(context, status);
        receiver.supply.off();
      } else if (status.error) {
        receiver.supply.off(status.error);
      }
    },
  }));
}
