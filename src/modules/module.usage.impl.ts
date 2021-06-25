import {
  AfterEvent,
  AfterEvent__symbol,
  mapAfter_,
  OnEvent,
  onEventBy,
  supplyAfter,
  trackValue,
  ValueTracker,
} from '@proc7ts/fun-events';
import { noop, valueProvider } from '@proc7ts/primitives';
import { neverSupply, Supply, SupplyPeer } from '@proc7ts/supply';
import { CxSupply } from '../conventional';
import { CxAsset, CxEntry, CxRequest, CxValues } from '../core';
import type { CxModule } from './module';

export class CxModule$Usage {

  private readonly _impl: ValueTracker<CxModule | undefined>;
  private readonly _rev: ValueTracker<CxModule$Rev>;
  private _useCounter = 0;

  private _setup!: () => void;

  constructor(context: CxValues, readonly module: CxModule) {
    this._impl = trackValue();
    this._rev = trackValue({
      status: {
        module: this.module,
        provided: false,
        used: false,
        settled: false,
        ready: false,
      },
      supply: neverSupply(),
    });

    const contextSupply = context.get(CxSupply);

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

  createHandle(): CxModule.Handle {

    const read: AfterEvent<[CxModule.Status]> = this._rev.read.do(
        mapAfter_(({ status }) => status),
    );

    const handle: CxModule.Handle = {
      read,
      [AfterEvent__symbol]: valueProvider(read),
      use: (user?: SupplyPeer) => this._use(handle, user),
    };

    return handle;
  }

  setup(target: CxEntry.Target<CxModule.Handle, CxModule>): void {
    this._setup = () => {

      const rev = this._rev.it;
      const { status: { module }, supply } = rev;

      if (module !== this.module) {
        // Load implementation module instead.
        // The implementation module expected to be provided already.
        target.get(module).use(supply).read({
          supply,
          receive: (_ctx, { settled, ready, error }) => {
            this._updateStatus(rev, settled, ready, error);
          },
        });
      } else {
        CxModule$load(target, rev)
            .then(({ whenReady }) => {
              this._updateStatus(rev, true, false);
              return whenReady;
            })
            .then(() => this._updateStatus(rev, true, true))
            .catch(error => rev.supply.off(error));
      }
    };
  }

  implementBy(impl: AfterEvent<[CxModule?]>): void {
    this._impl.by(impl);
  }

  private _updateStatus(
      rev: CxModule$Rev,
      settled: boolean,
      ready: boolean,
      error?: unknown,
  ): void {
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
          settled,
          ready,
          error,
        },
        supply: rev.supply,
      };
    }
  }

  private _load(module: CxModule): void {

    const supply = new Supply(noop).needs(this._rev).whenOff(error => {

      const rev = this._rev.it;

      if (rev.supply === supply) {
        this._rev.it = {
          status: {
            ...this._rev.it.status,
            provided: false,
            settled: false,
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
        settled: false,
        ready: false,
      },
      supply,
    };

    if (used) {
      this._setup();
    }
  }

  private _use(handle: CxModule.Handle, user?: SupplyPeer): CxModule.Use {

    const supply = new Supply(noop);

    if (user) {
      supply.needs(user);
    }

    const read = handle.read.do(supplyAfter(supply));
    const use: CxModule.Use = {
      ...handle,
      read,
      whenSettled: CxModule$Use$when(read, CxModule$isSettled),
      whenReady: CxModule$Use$when(read, CxModule$isReady),
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
              settled: false,
              ready: false,
              error,
            },
            supply: new Supply(noop).off(error),
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

}

interface CxModule$Rev {

  readonly status: CxModule.Status;
  readonly supply: Supply;

}

async function CxModule$load(
    target: CxEntry.Target<CxModule.Handle, CxModule>,
    { status: { module }, supply }: CxModule$Rev,
): Promise<CxModule$Init> {

  const moduleInit = new CxModule$Init(module);

  await module.setup({

    context: target.context,
    module,
    supply,

    get<TValue>(entry: CxEntry<TValue, any>, request?: CxRequest<TValue>): TValue | null {
      return target.get(entry, request);
    },

    provide<TValue, TAsset = TValue>(asset: CxAsset<TValue, TAsset>): Supply {
      return target.provide(asset).needs(supply);
    },

    initBy(init: (this: void) => (void | PromiseLike<unknown>)) {
      moduleInit.initBy(init);
    },

  });

  return moduleInit;
}

class CxModule$Init {

  readonly whenReady: Promise<unknown>;
  private _whenDone: Promise<unknown> = Promise.resolve();
  private _ready!: (result?: PromiseLike<unknown>) => void;

  constructor(private readonly _module: CxModule) {
    this.whenReady = new Promise(resolve => this._ready = resolve);
  }

  initBy(init: (this: void) => void | PromiseLike<unknown>): void {

    const rev: Promise<unknown> = this._whenDone = this._whenDone
        .then(init)
        .finally(() => this._done(rev));

  }

  private _done(rev: Promise<unknown>): void {
    if (this._whenDone === rev) {
      this._ready(rev);
      this.initBy = _init => {
        throw new TypeError(`${this._module} initialized already, and does not accept new initializers`);
      };
    }
  }

}

function CxModule$Use$when(
    status: AfterEvent<[CxModule.Status]>,
    test: (status: CxModule.Status) => boolean,
): OnEvent<[CxModule.Status]> {
  return onEventBy(receiver => status({
    supply: receiver.supply,
    receive: (context, status) => {
      if (test(status)) {
        receiver.receive(context, status);
        receiver.supply.off();
      } else if (status.error) {
        receiver.supply.off(status.error);
      }
    },
  }));
}

function CxModule$isSettled({ settled }: CxModule.Status): boolean {
  return settled;
}

function CxModule$isReady({ ready }: CxModule.Status): boolean {
  return ready;
}
