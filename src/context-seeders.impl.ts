import type { ContextKey, ContextSeedKey } from './context-key';
import type { ContextSeeder, ContextSeeds } from './context-seeder';
import type { ContextValues } from './context-values';

/**
 * @internal
 */
export type SeedIssuer<TCtx extends ContextValues, TSrc, TSeed> = readonly [
  seeder: ContextSeeder<TCtx, TSrc, TSeed>,
  factory: (this: void, context: TCtx) => TSeed,
];

/**
 * @internal
 */
export class ContextSeeders<TCtx extends ContextValues> {

  private readonly _issuers = new Map<ContextSeedKey<any, any>, SeedIssuer<TCtx, any, any>>();

  constructor(private readonly _initial: ContextSeeds<TCtx>) {
  }

  issuer<TSrc, TSeed>(seedKey: ContextSeedKey<TSrc, TSeed>): SeedIssuer<TCtx, TSrc, TSeed> {

    const found: SeedIssuer<TCtx, TSrc, TSeed> | undefined = this._issuers.get(seedKey);

    if (found) {
      return found;
    }

    const seeder: ContextSeeder<TCtx, TSrc, TSeed> = seedKey.seeder();
    const issuer: SeedIssuer<TCtx, TSrc, TSeed> = [
      seeder,
      context => seeder.seed(context, this._initial(seedKey, context)),
    ];

    this._issuers.set(seedKey, issuer);

    return issuer;
  }

  newSeed<TSrc, TSeed>(
      context: TCtx,
      key: ContextKey<any, TSrc, TSeed>,
  ): readonly [seeder: ContextSeeder<TCtx, TSrc, TSeed>, seed: TSeed] {

    const { seedKey } = key;
    const [seeder, factory] = this.issuer(seedKey);

    if (seedKey !== key as any) {
      // This is not a seed key
      // Retrieve the seed by seed key
      return [seeder, context.get(seedKey)];
    }

    return [seeder, factory(context)];
  }

}
