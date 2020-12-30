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

  private _execution?: Promise<unknown> = undefined;
  private _postponed: (() => Promise<void>)[] = [];

  constructor(private readonly _supply: Supply) {
  }

  now<T>(task: (this: void) => T | PromiseLike<T>): Promise<T> {

    let execution: Promise<void>;
    const finish = (): void => {
      if (this._execution === execution) {
        this._execution = undefined;
        this._execPostponed();
      }
    };

    const exec = this._toTask(task);
    const result = Promise.resolve().then(exec); // Do not execute the task immediately
    const prevExecution = this._execution ? this._execution.then(() => result) : result;

    this._execution = execution = prevExecution.then(finish, finish);

    return result;
  }

  later<T>(task: (this: void) => T | PromiseLike<T>): Promise<T> {
    if (!this._execution) {
      return this.now(task);
    }

    return new Promise<T>((resolve, reject) => {

      const exec = this._toTask(task);

      this._postponed.push(async () => {

        const result = exec();

        result.then(resolve, reject);

        await result.catch(noop);
      });
    });
  }

  private _toTask<T>(task: () => T | PromiseLike<T>): () => Promise<T> {
    this._supply.whenOff((reason = new TypeError('Context destroyed')) => {
      task = () => {
        throw reason;
      };
    });

    return async (): Promise<T> => await task();
  }

  private _execPostponed(): void {

    const postponed = this._postponed;

    if (postponed.length) {
      this._postponed = [];
      this._execution = Promise.all(postponed.map(task => task()));
    }
  }

}
