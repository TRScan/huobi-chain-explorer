import { QueryManyFn, QueryOneFn } from '@muta-extra/hermit-purple';
import { Address, Hash, Uint64 } from '@mutadev/types';
import BigNumber from 'bignumber.js';
import { ASSET } from '../../db-mysql/constants';
import { Asset as DBAsset } from '../../generated/types';
import { Asset as AssetModel } from '../../types';
import { AssetAmountHelper } from './AssetAmountHelper';
import { AssetModelFetcher } from './AssetModelFetcher';

export class AssetModelService {
  constructor(
    private readonly fetcher: AssetModelFetcher = new AssetModelFetcher(),
    private readonly helper: AssetAmountHelper = new AssetAmountHelper(fetcher),
  ) {}

  findByAssetId: QueryOneFn<AssetModel, string> = (assetId) => {
    return this.fetcher.findOne(assetId);
  };

  filter: QueryManyFn<AssetModel, {}> = async (args) => {
    const dbAssets = await this.fetcher.knexHelper.findMany<DBAsset>(ASSET, {
      page: args.pageArgs,
      orderBy: ['name', 'asc'],
    });

    return Promise.all(
      dbAssets.map((asset) =>
        this.fetcher.findOne(asset.assetId).then((x) => x!),
      ),
    );
  };

  async getAmount(assetId: Hash, value: Uint64 | number | BigNumber | null) {
    if (!value) return '0';
    return this.helper.getAmount(assetId, value);
  }

  async getBalance(assetId: Hash, address: Address): Promise<string> {
    const balance = await this.helper.getBalance(assetId, address);
    return balance ?? '0';
  }
}
