import { noop } from '@proc7ts/primitives';
import { ContextKey, ContextKey__symbol, ContextSeedKey, ContextValueSetup, ContextValueSlot } from './context-key';
import { ContextKeyError } from './context-key-error';
import { ContextRef, ContextRequest } from './context-ref';
import { ContextRegistry } from './context-registry';
import { ContextSeeder, ContextSeeds } from './context-seeder';
import { ContextValues } from './context-values';

/**
 * @internal
 */
export type SeedFactory<Ctx extends ContextValues, Seed> = (this: void, context: Ctx) => Seed;

/**
 * @internal
 */
export type SeedData<Ctx extends ContextValues, Src, Seed> = readonly [
    seeder: ContextSeeder<Ctx, Src, Seed>,
    factory: SeedFactory<Ctx, Seed>,
];

/**
 * @internal
 */
export class ContextSeedRegistry<Ctx extends ContextValues> {

  private readonly _byKey = new Map<ContextSeedKey<any, any>, SeedData<Ctx, any, any>>();

  constructor(private readonly _initial: ContextSeeds<Ctx>) {
  }

  seedData<Src, Seed>(seedKey: ContextSeedKey<Src, Seed>): SeedData<Ctx, Src, Seed> {

    const found: SeedData<Ctx, Src, Seed> | undefined = this._byKey.get(seedKey);

    if (found) {
      return found;
    }

    const seeder: ContextSeeder<Ctx, Src, Seed> = seedKey.seeder();
    const factory: SeedFactory<Ctx, Seed> = context => seeder.seed(context, this._initial(seedKey, context));
    const seedData: SeedData<Ctx, Src, Seed> = [seeder, factory];

    this._byKey.set(seedKey, seedData);

    return seedData;
  }

  /**
   * @internal
   */
  findSeed<Src, Seed>(
      context: Ctx,
      key: ContextKey<any, Src, Seed>,
  ): readonly [seeder: ContextSeeder<Ctx, Src, Seed>, seed: Seed] {

    const { seedKey } = key;
    const [seeder, factory] = this.seedData(seedKey);

    if (seedKey !== key as any) {
      // This is not a seed key
      // Retrieve the seed by seed key
      return [seeder, context.get(seedKey)];
    }

    return [seeder, factory(context)];
  }

}

/**
 * @internal
 */
export function newContextValues<Ctx extends ContextValues>(
    registry: ContextRegistry<Ctx>,
    seedRegistry: ContextSeedRegistry<Ctx>,
): ContextValues {

    const values = new Map<ContextKey<any>, any>();

    class Values extends ContextValues {

        get<Value, Src>(
            this: Ctx,
            { [ContextKey__symbol]: key }: ContextRef<Value, Src>,
            opts?: ContextRequest.Opts<Value>,
        ): Value | null | undefined {

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
                    registry: registry as ContextRegistry<any> as ContextRegistry,
                });
            }

            return constructed;
        }

    }

    return new Values();
}

/**
 * @internal
 */
class ContextValueSlot$<Ctx extends ContextValues, Value, Src, Seed>
    implements ContextValueSlot.Base<Value, Src, Seed> {

    readonly hasFallback: boolean;
    readonly seeder: ContextSeeder<Ctx, Src, Seed>;
    readonly seed: Seed;
    private _constructed: Value | null | undefined = null;
    private _setup: ContextValueSetup<Value, Src, Seed> = noop;

    constructor(
        registry: ContextSeedRegistry<Ctx>,
        readonly context: Ctx,
        readonly key: ContextKey<Value, Src, Seed>,
        private readonly _opts: ContextRequest.Opts<Value> = {},
    ) {

        const [seeder, seed] = registry.findSeed<Src, Seed>(context, key);

        this.seeder = seeder;
        this.seed = seed;
        this.hasFallback = 'or' in _opts;
    }

    get or(): Value | null | undefined {
        return this._opts.or;
    }

    insert(value: Value | null | undefined): void {
        this._constructed = value;
    }

    fillBy(grow: (this: void, slot: ContextValueSlot<Value, Src, Seed>) => void): Value | null | undefined {
        grow(this as ContextValueSlot<Value, Src, Seed>);
        return this._constructed;
    }

    setup(setup: ContextValueSetup<Value, Src, Seed>): void {

        const prevSetup = this._setup;

        this._setup = opts => {
            prevSetup(opts);
            setup(opts);
        };
    }

    _grow(): readonly [value: Value | null | undefined, setup?: ContextValueSetup<Value, Src, Seed>] {
        this.key.grow(this as ContextValueSlot<Value, Src, Seed>);

        if (this._constructed != null) {
            return [this._constructed, this._setup];
        }
        if (!this.hasFallback) {
            throw new ContextKeyError(this.key);
        }

        return [this.or];
    }

}
