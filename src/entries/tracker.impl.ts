import { Supply } from '@proc7ts/supply';
import { CxEntry, CxRequestMethod, CxTracker, CxTracking, cxUnavailable } from '../core';

export function CxTracker$assign<TValue, TAsset, TState>(
    { to }: CxTracker<TState>,
    _target: CxEntry.Target<TValue, TAsset>,
): CxEntry.Assigner<TValue> {
  return to as CxEntry.Assigner<any>;
}

export function CxTracker$create<T>(
    target: CxEntry.Target<unknown>,
    trackAssets: (
        receiver: CxTracking.Receiver<T>,
        tracking?: CxTracking,
    ) => Supply,
    getDefault?: () => T,
): CxTracker<T> {

  const trackerSupply = new Supply().needs(target);
  const track = getDefault
      ? (
          receiver: CxTracking.Receiver<T>,
          { supply = new Supply() } = {},
      ): Supply => trackAssets(
          (value?: T, by?: CxRequestMethod) => {
            if (by != null) {
              receiver(value as T, by);
            } else {
              receiver(getDefault(), CxRequestMethod.Defaults);
            }
          },
          supply.needs(trackerSupply),
      )
      : (
          receiver: CxTracking.Receiver<T>,
          { supply = new Supply() } = {},
      ): Supply => trackAssets(receiver, supply.needs(trackerSupply));

  let get: () => T;
  let to: (receiver: CxTracking.MandatoryReceiver<T>) => void;
  const init = (): Supply => track(
      (value?: T, by?: CxRequestMethod) => {
        if (by != null) {
          get = () => value!;
          to = receiver => receiver(value!, by);
        } else {
          get = cxUnavailable(target.entry);
          to = CxTracker$empty$to;
        }
      },
      trackerSupply,
  );

  get = (): T => {
    init();
    return get();
  };
  to = (receiver: CxTracking.MandatoryReceiver<T>): void => {
    init();
    to(receiver);
  };

  trackerSupply.whenOff(reason => {
    get = to = cxUnavailable(target.entry, undefined, reason);
  });

  return {
    supply: trackerSupply,
    get: () => get(),
    to: receiver => to(receiver),
    track,
  };
}

export function CxTracker$default<T>(target: CxEntry.Target<unknown>, getDefault?: () => T): CxTracker<T> {
  return CxTracker$create(
      target,
      (receiver: CxTracking.Receiver<T>, { supply = new Supply() }: CxTracking = {}): Supply => {
        if (!supply.needs(target).isOff) {
          receiver();
        }
        return supply;
      },
      getDefault,
  );
}

function CxTracker$empty$to(_receiver: CxTracking.MandatoryReceiver<any>): void {
  // No current value
}
