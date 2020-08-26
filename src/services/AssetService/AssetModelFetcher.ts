import { envNum, KnexHelper } from '@muta-extra/hermit-purple';
import AsyncCache from 'async-cache';
import { AssetService as HuobiAssetService } from 'huobi-chain-sdk';
import { promisify } from 'util';
import { ASSET } from '../../db-mysql/constants';
import { Asset as AssetModel } from '../../types';
import { chainAssetToAssetModel } from './transform';

export class AssetModelFetcher {
  private readonly cache: AsyncCache.Cache<AssetModel>;
  readonly knexHelper: KnexHelper;
  readonly assetService: InstanceType<typeof HuobiAssetService>;

  constructor() {
    const service = (this.assetService = new HuobiAssetService());
    const helper = (this.knexHelper = new KnexHelper());

    this.cache = new AsyncCache({
      maxAge: envNum('HERMIT_CACHE_TTL', 3) * 1000,
      async load(assetId, cb) {
        const [resAsset, dbAsset] = await Promise.all([
          service.read.get_asset({ id: assetId }),
          helper.findOne<AssetModel>(ASSET, { assetId }),
        ]);
        cb(null, chainAssetToAssetModel(resAsset.succeedData, dbAsset?.txHash));
      },
    });
  }

  findOne(assetId: string): Promise<AssetModel | null> {
    const get = promisify(this.cache.get.bind(this.cache));
    return get(assetId);
  }
}
