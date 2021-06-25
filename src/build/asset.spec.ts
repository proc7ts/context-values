import { beforeEach, describe, expect, it } from '@jest/globals';
import { cxBuildAsset, cxConstAsset } from '../assets';
import { CxEntry, CxValues } from '../core';
import { CxBuilder } from './builder';

describe('CxAsset', () => {

  let builder: CxBuilder;

  beforeEach(() => {
    builder = new CxBuilder(get => ({ get }));
  });

  let builder2: CxBuilder;
  let context2: CxValues;

  beforeEach(() => {
    builder2 = new CxBuilder(get => ({ get }), builder);
    context2 = builder2.context;
  });

  describe('Provided', () => {
    describe('recentAsset', () => {
      it('returns most recent value asset', () => {

        const entry: CxEntry<number[], number> = {
          perContext(target) {

            let value: number[] = [];

            target.trackAssetList(assets => {

              const newValue: number[] = [];

              for (const { recentAsset } of assets) {
                if (recentAsset) {
                  newValue.push(recentAsset.asset);
                }
              }

              value = newValue;
            });

            return {
              assign(assigner) {
                assigner(value);
              },
            };
          },
        };

        builder2.provide(cxConstAsset(entry, 1));
        builder2.provide(cxBuildAsset(entry, () => null));
        builder.provide({
          entry: entry,
          placeAsset(_target, collector) {
            collector(11);
            collector(12);
            collector(13);
          },
        });

        expect(context2.get(entry)).toEqual([1, 13]);
      });
    });
    describe('eachRecentAsset', () => {
      it('iterates over assets in most-recent-first order', () => {

        const entry: CxEntry<number[], number> = {
          perContext(target) {

            let value: number[] = [];

            target.trackAssetList(assets => {

              const newValue: number[] = [];

              for (const provided of assets) {
                provided.eachRecentAsset(asset => {
                  newValue.push(asset);
                });
              }

              value = newValue;
            });

            return {
              assign(assigner) {
                assigner(value);
              },
            };
          },
        };

        builder2.provide(cxConstAsset(entry, 1));
        builder2.provide(cxBuildAsset(entry, () => null));
        builder.provide({
          entry: entry,
          placeAsset(_target, collector) {
            collector(11);
            collector(12);
            collector(13);
          },
        });

        expect(context2.get(entry)).toEqual([1, 13, 12, 11]);
      });
    });
  });
});
