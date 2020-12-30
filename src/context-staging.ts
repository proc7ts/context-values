import type { Supply } from '@proc7ts/primitives';
import { ContextKey, ContextKey__symbol } from './context-key';
import {
  ContextStagingQ,
  ContextStagingQueue,
  ContextStagingQueue__symbol,
  NoContextStagingQ,
} from './context-staging-queue.impl';
import { ContextSupply } from './context-supply';
import type { ContextValues } from './context-values';
import { SingleContextKey } from './single-context-key';

const ContextStaging__key = (/*#__PURE__*/ new SingleContextKey<ContextStaging>(
    'context-staging',
    {
      byDefault(context: ContextValues) {
        return new ContextStaging(context.get(ContextSupply));
      },
    },
));

export class ContextStaging {

  static get [ContextKey__symbol](): ContextKey<ContextStaging> {
    return ContextStaging__key;
  }

  private [ContextStagingQueue__symbol]: ContextStagingQueue;

  constructor(supply: Supply) {
    this[ContextStagingQueue__symbol] = new ContextStagingQ(supply);
    supply.whenOff(reason => {
      this[ContextStagingQueue__symbol] = new NoContextStagingQ(reason);
    });
  }

  now<T>(task: (this: void) => T | PromiseLike<T>): Promise<T> {
    return this[ContextStagingQueue__symbol].now(task);
  }

  later<T>(task: (this: void) => T | PromiseLike<T>): Promise<T> {
    return this[ContextStagingQueue__symbol].later(task);
  }

}
