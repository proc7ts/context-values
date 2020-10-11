import { ContextKey, ContextSeedKey } from './context-key';
import { ContextSeeder, ContextSeeds } from './context-seeder';
import { ContextValues } from './context-values';

/**
 * @internal
 */
export type SeedFactory<TCtx extends ContextValues, TSeed> = (this: void, context: TCtx) => TSeed;

/**
 * @internal
 */
export type SeedData<TCtx extends ContextValues, TSrc, TSeed> = readonly [
    seeder: ContextSeeder<TCtx, TSrc, TSeed>,
    factory: SeedFactory<TCtx, TSeed>,
];

/**
 * @internal
 */
export class ContextSeedRegistry<TCtx extends ContextValues> {

  private readonly _byKey = new Map<ContextSeedKey<any, any>, SeedData<TCtx, any, any>>();

  constructor(private readonly _initial: ContextSeeds<TCtx>) {
  }

  seedData<TSrc, TSeed>(seedKey: ContextSeedKey<TSrc, TSeed>): SeedData<TCtx, TSrc, TSeed> {

    const found: SeedData<TCtx, TSrc, TSeed> | undefined = this._byKey.get(seedKey);

    if (found) {
      return found;
    }

    const seeder: ContextSeeder<TCtx, TSrc, TSeed> = seedKey.seeder();
    const factory: SeedFactory<TCtx, TSeed> = context => seeder.seed(context, this._initial(seedKey, context));
    const seedData: SeedData<TCtx, TSrc, TSeed> = [seeder, factory];

    this._byKey.set(seedKey, seedData);

    return seedData;
  }

  /**
   * @internal
   */
  findSeed<TSrc, TSeed>(
      context: TCtx,
      key: ContextKey<any, TSrc, TSeed>,
  ): readonly [seeder: ContextSeeder<TCtx, TSrc, TSeed>, seed: TSeed] {

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
