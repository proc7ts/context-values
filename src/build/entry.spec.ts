import { beforeEach, describe, expect, it } from '@jest/globals';
import { Supply } from '@proc7ts/supply';
import { cxConstAsset } from '../assets';
import { CxAsset, CxEntry, CxValues } from '../core';
import { CxBuilder } from './builder';

describe('CxEntry', () => {

  let builder: CxBuilder;
  let context: CxValues;

  beforeEach(() => {
    builder = new CxBuilder(get => ({ get }));
    context = builder.context;
  });

  let builder2: CxBuilder;
  let context2: CxValues;

  beforeEach(() => {
    builder2 = new CxBuilder(get => ({ get }), builder);
    context2 = builder2.context;
  });

  describe('Definition', () => {
    describe('get', () => {
      it('is ignored when absent', () => {

        const entry: CxEntry<string> = {
          perContext() {
            return {
              getDefault() {
                return 'default';
              },
            };
          },
        };

        expect(context.get(entry)).toBe('default');
        expect(context.get(entry, { or: null })).toBeNull();

        builder.provide(cxConstAsset(entry, 'other'));
        expect(context.get(entry)).toBe('default');
        expect(context.get(entry, { or: null })).toBeNull();
      });
    });
  });

  describe('Target', () => {
    describe('eachAsset', () => {

      const entry: CxEntry<string> = {
        perContext(target) {
          return {
            get() {

              let result = '';

              target.eachAsset(asset => {
                result += asset;
                if (result.length > 2) {
                  target.supply.off();
                }
              });

              return result;
            },
          };
        },
      };

      it('is aborted when supply cut off', () => {
        builder.provide(cxConstAsset(entry, 'a'));
        builder.provide(cxConstAsset(entry, 'b'));
        builder.provide(cxConstAsset(entry, 'c'));
        builder.provide(cxConstAsset(entry, 'd'));

        expect(context.get(entry)).toBe('abc');
        expect(context.get(entry)).toBe('');
      });
      it('is aborted in parent context when supply cut off', () => {
        builder.provide(cxConstAsset(entry, 'a'));
        builder.provide(cxConstAsset(entry, 'b'));
        builder.provide(cxConstAsset(entry, 'c'));
        builder.provide(cxConstAsset(entry, 'd'));
        builder2.provide(cxConstAsset(entry, 'e'));

        expect(context2.get(entry)).toBe('abc');
        expect(context2.get(entry)).toBe('');
      });
    });

    describe('eachRecentAsset', () => {
      it('is aborted when supply cut off', () => {

        const entry: CxEntry<string> = {
          perContext(target) {
            return {
              get() {

                let result = '';

                target.eachRecentAsset(asset => {
                  result += asset;
                  if (result.length > 2) {
                    target.supply.off();
                  }
                });

                return result;
              },
            };
          },
        };
        builder.provide(cxConstAsset(entry, 'a'));
        builder.provide(cxConstAsset(entry, 'b'));
        builder.provide(cxConstAsset(entry, 'c'));
        builder.provide(cxConstAsset(entry, 'd'));

        expect(context.get(entry)).toBe('dcb');
        expect(context.get(entry)).toBe('');
      });
      it('is aborted when supply cut off by asset', () => {

        const entry: CxEntry<string, number> = {
          perContext(target) {
            return {
              get() {

                let result = '';

                target.eachRecentAsset(asset => {
                  result += asset;
                });

                return result;
              },
            };
          },
        };
        const asset: CxAsset<unknown, number> = {
          entry,
          supply: new Supply(),
          placeAsset(target, collector) {
            for (let i = 0; i < 10; ++i) {
              if (i > 2) {
                target.supply.off();
              }
              if (collector(i) === false) {
                break;
              }
            }
          },
        };

        builder.provide(asset);

        expect(context.get(entry)).toBe('012');
        expect(context.get(entry)).toBe('');
      });
    });

    describe('trackAssets', () => {
      it('is aborted when tracking supply cut off', () => {

        const entry: CxEntry<string> = {
          perContext(target) {

            const list: CxAsset.Provided<string>[] = [];
            let value = '';

            const trackingSupply = target.trackAssets(provided => {
              list.push(provided);
              value = '';
              for (const provided of list) {
                provided.eachAsset(asset => {
                  value += asset;
                  if (asset === '!') {
                    trackingSupply.off();
                    target.provide(cxConstAsset(entry, '*'));
                  }
                });
              }
            });

            return {
              get() {
                return value;
              },
            };
          },
        };

        builder.provide(cxConstAsset(entry, 'a'));
        builder.provide(cxConstAsset(entry, 'b'));
        builder.provide(cxConstAsset(entry, 'c'));

        expect(context.get(entry)).toBe('abc');

        builder.provide(cxConstAsset(entry, '!'));
        builder.provide(cxConstAsset(entry, 'd'));

        expect(context.get(entry)).toBe('abc!');
      });
    });
  });
});
