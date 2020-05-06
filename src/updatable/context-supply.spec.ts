import { eventSupply, EventSupply__symbol, EventSupplyPeer } from '@proc7ts/fun-events';
import { ContextRegistry } from '../context-registry';
import { ContextValues } from '../context-values';
import { ContextSupply } from './context-supply';

describe('ContextSupply', () => {
  it('is not defined by default', () => {

    const values = new ContextRegistry().newValues();

    expect(values.get(ContextSupply, { or: null })).toBeNull();
  });
  it('is equal to supply of context when context is a peer', () => {

    const values = new ContextRegistry().newValues();
    const supply = eventSupply();
    const context: ContextValues & EventSupplyPeer = {
      get: values.get,
      [EventSupply__symbol]: supply,
    };

    expect(context.get(ContextSupply, { or: null })).toBe(supply);
  });
});
