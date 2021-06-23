import { trackValue, ValueTracker } from '@proc7ts/fun-events';
import { itsElements } from '@proc7ts/push-iterator/src';
import { Supply } from '@proc7ts/supply';
import { CxEntry } from '../core';

export type CxEntry$AssetsByRank<TAsset> = Map<Supply, CxEntry.Asset<TAsset>>[];

export function CxEntry$assetsByRank<TAsset>(
    target: CxEntry.Target<unknown, TAsset>,
): ValueTracker<CxEntry$AssetsByRank<TAsset>> {

  const assetsByRank = trackValue<CxEntry$AssetsByRank<TAsset>>([]);

  assetsByRank.supply.needs(target);

  const removeAsset = (supply: Supply, rank: number): void => {

    const ranks = [...assetsByRank.it];
    const rankAssets = ranks[rank]!;

    rankAssets.delete(supply);
    assetsByRank.it = ranks;
  };
  const addAsset = (asset: CxEntry.Asset<TAsset>): void => {

    const { supply, rank } = asset;
    const ranks = [...assetsByRank.it];

    for (let i = ranks.length; i <= rank; ++i) {
      ranks[i] ||= new Map();
    }

    const rankAssets = ranks[rank];

    rankAssets.set(supply, asset);
    assetsByRank.it = ranks;

    supply.whenOff(() => removeAsset(supply, rank));
  };

  target.trackAssets(addAsset);

  return assetsByRank;
}

export function CxEntry$actualAsset<TAsset>(
    assetsByRank: CxEntry$AssetsByRank<TAsset>,
): CxEntry.ExistingAsset<TAsset> | undefined {
  for (const rankAssets of assetsByRank) {

    const assets: CxEntry.Asset<TAsset>[] = itsElements(rankAssets.values());

    for (let i = assets.length - 1; i >= 0; --i) {

      const asset = assets[i];

      if (CxEntry$assetExists(asset)) {
        return asset;
      }
    }
  }

  return;
}

function CxEntry$assetExists<TAsset>(asset: CxEntry.Asset<TAsset>): asset is CxEntry.ExistingAsset<TAsset> {
  return asset.get() != null;
}
