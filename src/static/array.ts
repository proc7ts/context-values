import { lazyValue } from '@proc7ts/primitives';
import { CxEntry } from '../entry';

/**
 * Creates array-valued context entry definer.
 *
 * The entry value is a read-only array of assets.
 *
 * The entry value is evaluated at most once.
 *
 * @typeParam TElement - Array element type. The same as entry value asset type.
 * @param byDefault - Creates {@link CxEntry.Definition.getDefault default} entry value. Accepts entry definition target
 * as the only parameter.
 *
 * @returns New context entry definer.
 */
export function cxArray<TElement>(
    {
      byDefault,
    }: {
      byDefault?: (
          this: void,
          target: CxEntry.Target<readonly TElement[], TElement>,
      ) => readonly TElement[] | undefined;
    } = {},
): CxEntry.Definer<readonly TElement[], TElement> {
  return target => {

    const peers: CxEntry.Peer<TElement>[] = [];

    return {
      addPeer(peer: CxEntry.Peer<TElement>): void {
        peers.push(peer);
      },
      get: lazyValue(() => {

        const array: TElement[] = [];

        for (const peer of peers) {
          peer.readAssets(getAsset => {

            const asset = getAsset();

            if (asset != null) {
              array.push(asset);
            }
          }).off();
        }

        return array.length ? array : null;
      }),
      getDefault: byDefault && lazyValue(() => byDefault(target)),
    };
  };
}
