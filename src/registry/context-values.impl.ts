import { noop } from '@proc7ts/primitives';
import { ContextKeyError } from '../context-key-error';
import type { ContextRef } from '../context-ref';
import type { ContextRequest } from '../context-request';
import { ContextValues } from '../context-values';
import type { ContextSeeder, ContextValueSetup, ContextValueSlot } from '../key';
import { ContextKey, ContextKey__symbol } from '../key';
import type { ContextRegistry } from './context-registry';
import type { ContextSeeders } from './context-seeders.impl';

/**
 * @internal
 */
export function newContextValues<TCtx extends ContextValues>(
    registry: ContextRegistry<TCtx>,
    seeders: ContextSeeders<TCtx>,
): ContextValues {

  const values = new Map<ContextKey<any>, any>();

  return {

    get<TValue, TSrc>(
        this: TCtx,
        { [ContextKey__symbol]: key }: ContextRef<TValue, TSrc>,
        opts?: ContextRequest.Opts<TValue>,
    ): TValue | null | undefined {

      const cached = values.get(key);

      if (cached != null) {
        return cached;
      }

      const [constructed, setup] = new ContextValueSlot$(seeders, this, key, opts)._grow();

      if (setup) {
        values.set(key, constructed);
        setup({
          key,
          context: this,
          registry: registry as ContextRegistry<any>,
        });
      }

      return constructed;
    },

  };
}

class ContextValueSlot$<TCtx extends ContextValues, TValue, TSrc, TSeed>
    implements ContextValueSlot<TValue, TSrc, TSeed> {

  readonly seeder: ContextSeeder<TCtx, TSrc, TSeed>;
  readonly seed: TSeed;
  private _constructed: TValue | null | undefined = null;
  private _setup: ContextValueSetup<TValue, TSrc, TSeed> = noop;

  constructor(
      seeders: ContextSeeders<TCtx>,
      readonly context: TCtx,
      readonly key: ContextKey<TValue, TSrc, TSeed>,
      private readonly _opts: ContextRequest.Opts<TValue> = {},
  ) {

    const [seeder, seed] = seeders.newSeed<TSrc, TSeed>(context, key);

    this.seeder = seeder;
    this.seed = seed;
  }

  get or(): TValue | null | undefined {
    return this._opts.or; // Access here, as fallback value accessor may be implemented as getter.
  }

  insert(value: TValue | null | undefined): void {
    this._constructed = value;
  }

  fillBy(grow: (this: void, slot: ContextValueSlot<TValue, TSrc, TSeed>) => void): TValue | null | undefined {
    grow(this as ContextValueSlot<TValue, TSrc, TSeed>);
    return this._constructed;
  }

  setup(setup: ContextValueSetup<TValue, TSrc, TSeed>): void {

    const prevSetup = this._setup;

    this._setup = opts => {
      prevSetup(opts);
      setup(opts);
    };
  }

  _grow(): readonly [value: TValue | null | undefined, setup?: ContextValueSetup<TValue, TSrc, TSeed>] {
    this.key.grow(this as ContextValueSlot<TValue, TSrc, TSeed>);

    if (this._constructed != null) {
      return [this._constructed, this._setup];
    }
    if (this.or === undefined) {
      throw new ContextKeyError(this.key);
    }

    return [this.or];
  }

}
