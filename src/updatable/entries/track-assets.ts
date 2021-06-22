import { AfterEvent, trackValue, translateAfter_ } from '@proc7ts/fun-events';
import { flatMapIt, reverseArray } from '@proc7ts/push-iterator';
import { Supply } from '@proc7ts/supply';
import { CxAsset, CxEntry } from '../../core';

/**
 * Tracks updates of context entry assets.
 *
 * @param target - Context entry definition target.
 *
 * @returns An `AfterEvent` keeper of all available asset evaluators in the same order they are provided.
 */
export function trackUcxAssets<TAsset>(
    target: CxEntry.Target<unknown, TAsset>,
): AfterEvent<CxAsset.Evaluator<TAsset>[]> {

  const assetsByRank = trackValue<Map<Supply, CxAsset.Evaluator<TAsset>>[]>([]);

  assetsByRank.supply.needs(target);

  const removeAsset = (supply: Supply, rank: number): void => {

    const ranks = [...assetsByRank.it];
    const rankAssets = ranks[rank]!;

    rankAssets.delete(supply);
    assetsByRank.it = ranks;
  };
  const addAsset = ({ supply, rank, get }: CxEntry.NewAsset<TAsset>): void => {

    const ranks = [...assetsByRank.it];
    const rankAssets = ranks[rank] ||= new Map();

    rankAssets.set(supply, get);
    assetsByRank.it = ranks;

    supply.whenOff(() => removeAsset(supply, rank));
  };

  target.trackAssets(addAsset);

  return flattenUcxAssets(assetsByRank.read);
}

function flattenUcxAssets<TAsset>(
    assetsByRank: AfterEvent<[Map<Supply, CxAsset.Evaluator<TAsset>>[]]>,
): AfterEvent<CxAsset.Evaluator<TAsset>[]> {
  return assetsByRank.do(
      translateAfter_((send, ranks: Map<Supply, CxAsset.Evaluator<TAsset>>[]) => send(...flatMapIt(
          reverseArray(ranks),
          rankAssets => rankAssets.values(),
      ))),
  );
}
