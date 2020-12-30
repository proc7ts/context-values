import { asis, newPromiseResolver, noop, Supply } from '@proc7ts/primitives';
import { ContextRegistry } from './context-registry';
import { ContextStaging } from './context-staging';
import { ContextSupply } from './context-supply';

describe('ContextStaging', () => {

  let staging: ContextStaging;

  beforeEach(() => {
    staging = new ContextRegistry().newValues().get(ContextStaging);
  });

  it('executes task immediately', async () => {
    expect(await staging.now(() => 'result')).toBe('result');
  });
  it('executes a task from another task', async () => {

    let result1!: Promise<string>;

    expect(await staging.now(() => {
      result1 = staging.now(() => 'result1');
      return 'result2';
    })).toBe('result2');
    expect(await result1).toBe('result1');
  });
  it('postpones task execution', async () => {

    const results: string[] = [];
    let postponed!: Promise<string>;

    expect(await staging.now(() => {
      staging.later(() => results.push('postponed1')).catch(noop);
      staging.now(() => results.push('now')).catch(noop);
      staging.later(() => results.push('postponed2')).catch(noop);
      postponed = staging.later(() => 'postponed3');
      return 'result';
    })).toBe('result');
    expect(await postponed).toBe('postponed3');
    expect(results).toEqual(['now', 'postponed1', 'postponed2']);
  });
  it('executes postponed tasks only when all immediate tasks complete', async () => {

    const goon = newPromiseResolver<void>();
    const results: string[] = [];
    let postponed!: Promise<string>;

    expect(await staging.now(() => {
      staging.later(() => results.push('postponed1')).catch(noop);
      staging.now(() => goon.promise()).catch(noop);
      staging.now(() => results.push('now')).catch(noop);
      staging.later(() => results.push('postponed2')).catch(noop);
      postponed = staging.later(() => 'postponed3');
      return 'result';
    })).toBe('result');

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(results).toEqual(['now']);
    goon.resolve();

    expect(await postponed).toBe('postponed3');
    expect(results).toEqual(['now', 'postponed1', 'postponed2']);
  });

  describe('aborting', () => {

    let supply: ContextSupply;

    beforeEach(() => {
      supply = new Supply();

      const registry = new ContextRegistry();

      registry.provide({ a: ContextSupply, is: supply });

      staging = registry.newValues().get(ContextStaging);
    });

    it('aborts postponed executions', async () => {

      const goon = newPromiseResolver<void>();
      const results: string[] = [];

      expect(await staging.now(() => {
        staging.later(() => results.push('postponed1')).catch(noop);
        staging.now(() => goon.promise()).catch(noop);
        staging.now(() => results.push('now')).catch(noop);
        staging.later(() => results.push('postponed2')).catch(noop);
        return 'result';
      })).toBe('result');

      supply.off();

      expect(results).toEqual(['now']);
      goon.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(results).toEqual(['now']);
    });
    it('prevents tasks execution', async () => {

      const reason = new Error('reason');

      supply.off(reason);

      expect(await staging.now(() => 1).catch(asis)).toBe(reason);
    });
    it('prevents tasks postponing', async () => {

      const reason = new Error('reason');

      supply.off(reason);

      expect(await staging.later(() => 1).catch(asis)).toBe(reason);
    });
    it('prevents tasks execution with default reason', async () => {
      supply.off();

      const error = await staging.now(() => 1).catch(asis);

      expect(error).toBeInstanceOf(TypeError);
      expect(error.message).toBe('Context destroyed');
    });
  });
});
