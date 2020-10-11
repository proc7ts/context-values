import { noop } from '@proc7ts/primitives';
import { ContextKey, ContextKey__symbol, ContextValueSetup, ContextValueSlot } from './context-key';
import { ContextKeyError } from './context-key-error';
import { ContextRef, ContextRequest } from './context-ref';
import { ContextRegistry } from './context-registry';
import { ContextSeeder } from './context-seeder';
import { ContextSeeders } from './context-seeders.impl';
import { ContextValues } from './context-values';

/**
 * @internal
 */
export function newContextValues<TCtx extends ContextValues>(
    registry: ContextRegistry<TCtx>,
    seedRegistry: ContextSeeders<TCtx>,
): ContextValues {

  const values = new Map<ContextKey<any>, any>();

  class ContextValues$ extends ContextValues {

    get<TValue, TSrc>(
        this: TCtx,
        { [ContextKey__symbol]: key }: ContextRef<TValue, TSrc>,
        opts?: ContextRequest.Opts<TValue>,
    ): TValue | null | undefined {

      const cached = values.get(key);

      if (cached != null) {
        return cached;
      }

      const [constructed, setup] = new ContextValueSlot$(seedRegistry, this, key, opts)._grow();

      if (setup) {
        values.set(key, constructed);
        setup({
          key,
          context: this,
          registry: registry as ContextRegistry<any>,
        });
      }

      return constructed;
    }

  }

  return new ContextValues$();
}

/**
 * @internal
 */
class ContextValueSlot$<TCtx extends ContextValues, TValue, TSrc, TSeed>
    implements ContextValueSlot.Base<TValue, TSrc, TSeed> {

  readonly hasFallback: boolean;
  readonly seeder: ContextSeeder<TCtx, TSrc, TSeed>;
  readonly seed: TSeed;
  private _constructed: TValue | null | undefined = null;
  private _setup: ContextValueSetup<TValue, TSrc, TSeed> = noop;

  constructor(
      registry: ContextSeeders<TCtx>,
      readonly context: TCtx,
      readonly key: ContextKey<TValue, TSrc, TSeed>,
      private readonly _opts: ContextRequest.Opts<TValue> = {},
  ) {

    const [seeder, seed] = registry.newSeed<TSrc, TSeed>(context, key);

    this.seeder = seeder;
    this.seed = seed;
    this.hasFallback = 'or' in _opts;
  }

  get or(): TValue | null | undefined {
    return this._opts.or;
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
    if (!this.hasFallback) {
      throw new ContextKeyError(this.key);
    }

    return [this.or];
  }

}
