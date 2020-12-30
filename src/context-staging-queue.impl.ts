import { noop, Supply } from '@proc7ts/primitives';

/**
 * @internal
 */
export const ContextStagingQueue__symbol = (/*#__PURE__*/ Symbol('ContextStagingQueue'));

/**
 * @internal
 */
export interface ContextStagingQueue {

  now<T>(task: (this: void) => T | PromiseLike<T>): Promise<T>;

  later<T>(task: (this: void) => T | PromiseLike<T>): Promise<T>;

}

/**
 * @internal
 */
export class NoContextStagingQ implements ContextStagingQueue {

  constructor(private readonly _reason: unknown = new TypeError('Context destroyed')) {
  }

  now<T>(_task: (this: void) => (PromiseLike<T> | T)): Promise<T> {
    return Promise.reject(this._reason);
  }

  later<T>(task: (this: void) => (PromiseLike<T> | T)): Promise<T> {
    return this.now(task);
  }

}

/**
 * @internal
 */
export class ContextStagingQ implements ContextStagingQueue {

  private _execution: Promise<unknown> = Promise.resolve();
  private _postponed: (() => Promise<void>)[] = [];

  constructor(private readonly _supply: Supply) {
    this._supply.whenOff(() => {
      this._postponed = [];
    });
  }

  now<T>(task: (this: void) => T | PromiseLike<T>): Promise<T> {

    let execution: Promise<void>;
    const finish = (): void => {
      if (this._execution === execution) {
        this._execPostponed();
      }
    };

    const exec = contextStagingTask(task);
    const result = exec();

    this._execution = execution = this._execution.then(() => result).then(finish, finish);

    return result;
  }

  later<T>(task: (this: void) => T | PromiseLike<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {

      const exec = contextStagingTask(task);

      this._postponed.push(async () => {

        const result = exec();

        result.then(resolve, reject);

        await result.catch(noop);
      });
    });
  }

  private _execPostponed(): void {

    const postponed = this._postponed;

    if (postponed.length) {
      this._postponed = [];
      this._execution = Promise.all(postponed.map(task => task()));
    }
  }

}

function contextStagingTask<T>(task: () => T | PromiseLike<T>): () => Promise<T> {
  return async (): Promise<T> => await task();
}
