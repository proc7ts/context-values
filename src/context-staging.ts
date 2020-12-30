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

/**
 * A service for staged task execution.
 *
 * A task can be either executed immediately, or postponed to be executed after all currently executing tasks.
 */
export class ContextStaging {

  /**
   * A key of context value containing default stage task execution service instance.
   *
   * Always contain a value.
   *
   * Stops tasks execution on {@link ContextSupply context destruction} by default.
   */
  static get [ContextKey__symbol](): ContextKey<ContextStaging> {
    return ContextStaging__key;
  }

  /**
   * @internal
   */
  private [ContextStagingQueue__symbol]: ContextStagingQueue;

  /**
   * Constructs execution service.
   *
   * @param supply - Execution supply instance. When cut off the service stops accepting new tasks and aborts
   * postponed task execution.
   */
  constructor(supply: Supply) {
    this[ContextStagingQueue__symbol] = new ContextStagingQ(supply);
    supply.whenOff(reason => {
      this[ContextStagingQueue__symbol] = new NoContextStagingQ(reason);
    });
  }

  /**
   * Immediately executes the given task.
   *
   * The task may execute and postpone other tasks.
   *
   * @param task - The task to execute. Either synchronous or asynchronous.
   *
   * @returns A promise resolved to task execution result.
   */
  now<T>(task: (this: void) => T | PromiseLike<T>): Promise<T> {
    return this[ContextStagingQueue__symbol].now(task);
  }

  /**
   * Postpones the given task execution.
   *
   * The postponed tasks would start their execution only when all current tasks complete, regardless whether the latter
   * succeed or not.
   *
   * If there are no tasks currently executing, executes the task immediately.
   *
   * @param task - The task to postpone.
   *
   * @returns A promise resolved to task execution result.
   */
  later<T>(task: (this: void) => T | PromiseLike<T>): Promise<T> {
    return this[ContextStagingQueue__symbol].later(task);
  }

}
