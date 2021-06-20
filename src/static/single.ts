import { lazyValue } from '@proc7ts/primitives';
import { CxAsset, CxEntry } from '../entry';

/**
 * Creates single-valued context entry definer.
 *
 * Treats the last provided asset as entry value and ignores the rest of them.
 *
 * The entry value is evaluated at most once.
 *
 * @typeParam TValue - Context value type.
 * @param byDefault - Creates {@link CxEntry.Definition.getDefault default} entry value. Accepts entry definition target
 * as the only parameter.
 *
 * @returns New context entry definer.
 */
export function cxSingle<TValue>(
    {
      byDefault,
    }: {
      byDefault?: (this: void, target: CxEntry.Target<TValue>) => TValue | undefined;
    } = {},
): CxEntry.Definer<TValue> {
  return target => {

    const peers: CxEntry.Peer<TValue>[] = [];

    return {
      addPeer(peer: CxEntry.Peer<TValue>): void {
        peers.push(peer);
      },
      get: lazyValue(() => {

        const assets: CxAsset.Evaluator<TValue>[] = [];

        for (const peer of peers) {
          peer.readAssets(getAsset => assets.push(getAsset)).off();
        }

        let value: TValue | null | undefined;

        for (let i = assets.length - 1; i >= 0; --i) {
          value = assets[i]();
          if (value != null) {
            break;
          }
        }

        return value;
      }),
      getDefault: byDefault && lazyValue(() => byDefault(target)),
    };
  };
}
