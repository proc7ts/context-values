import { deduplicateAfter_, EventReceiver, mapAfter_ } from '@proc7ts/fun-events';
import { lazyValue, valueProvider } from '@proc7ts/primitives';
import { alwaysSupply, Supply } from '@proc7ts/supply';
import { CxSupply } from '../conventional';
import { CxAsset, CxEntry, CxRequest, CxValues } from '../core';
import { CxEntry$actualAsset, CxEntry$assetsByRank } from './entry.assets-by-rank.impl';
import { CxEntry$Record } from './entry.record.impl';
import { CxBuilder } from './index';

export class CxEntry$Target<TValue, TAsset, TContext extends CxValues>
    implements CxEntry.Target<TValue, TAsset, TContext> {

  readonly context: TContext;
  readonly entry: CxEntry<TValue, TAsset>;
  private readonly _builder: CxBuilder<TContext>;
  private readonly _getSupply: () => Supply;

  constructor(record: CxEntry$Record<TValue, TAsset, TContext>) {

    const builder = this._builder = record.builder;
    const entry = this.entry = record.entry;
    const context = this.context = builder.context;

    this._getSupply = entry === CxSupply as CxEntry<any>
        ? valueProvider(alwaysSupply())
        : lazyValue(() => new Supply().needs(context.get(CxSupply)));
  }

  get supply(): Supply {
    return this._getSupply();
  }

  get<TValue, TAsset = TValue>(entry: CxEntry<TValue, TAsset>, request?: CxRequest<TValue>): TValue | null {
    return this.context.get(entry, request);
  }

  provide<TValue, TAsset = TValue>(asset: CxAsset<TValue, TAsset, TContext>): Supply {
    return this._builder.provide(asset);
  }

  eachAsset(callback: CxAsset.Callback<TAsset>): void {
    this._builder.eachAsset(this, callback);
  }

  eachActualAsset(callback: CxAsset.Callback<TAsset>): void {
    this._builder.eachActualAsset(this, callback);
  }

  trackAssets(receiver: EventReceiver<[CxAsset.Provided<TAsset>]>): Supply {
    return this._builder.trackAssets(this, receiver);
  }

  trackActualAsset(receiver: EventReceiver<[CxAsset.Existing<TAsset> | undefined]>): Supply {
    return CxEntry$assetsByRank(this).read.do(
        mapAfter_(CxEntry$actualAsset),
        deduplicateAfter_(),
    )(receiver);
  }

}
