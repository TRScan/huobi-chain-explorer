import { KnexHelper, logger } from '@muta-extra/hermit-purple';
import { utils } from '@mutadev/muta-sdk';
import { Address, Hash, Uint64 } from '@mutadev/types';
import BigNumber from 'bignumber.js';
import LRUCache from 'lru-cache';
import { ASSET } from '../db-mysql/constants';
import { client } from '../muta';
import { Asset } from '../types';

BigNumber.config({ EXPONENTIAL_AT: 18 });

interface Balance {
  // hex formatted balance
  value: string;
  // hex formatted amount
  amount?: string;
}

export function toAmount(value: string, precision: number | BigNumber) {
  precision = new BigNumber(precision).toNumber();
  return new BigNumber(value, 16).shiftedBy(-precision).toString();
}

class AssetHelper {
  private cache: LRUCache<string, Asset>;
  private helper: KnexHelper = new KnexHelper();

  constructor() {
    this.cache = new LRUCache();
  }

  cacheAsset(asset: Asset) {
    this.cache.set(asset.assetId, asset);
  }

  async getDBAsset(assetId: string) {
    if (this.cache.has(assetId)) return this.cache.get(assetId)!;

    const asset = await this.helper.findOne<Asset>(ASSET, { assetId });
    if (!asset) return null;

    this.cacheAsset(asset);
    return asset;
  }

  async amountByAssetIdAndValue(
    assetId: Hash,
    value: Uint64 | number | BigNumber,
  ) {
    const asset = await this.getDBAsset(assetId);
    if (!asset) return '0';

    const precision = asset.precision;
    return new BigNumber(value, 16)
      .shiftedBy(-new BigNumber(precision!))
      .toString();
  }

  async getBalance(
    assetId: Hash,
    address: Address,
    withAmount: boolean,
  ): Promise<Balance> {
    const res = await client.queryService({
      serviceName: 'asset',
      method: 'get_balance',
      payload: utils.safeStringifyJSON({
        user: address,
        asset_id: utils.toHex(assetId),
      }),
    });

    if (Number(res.code) !== 0) {
      logger.info(
        `balance not found, address_id: ${assetId}. address: ${address} - ${res.code} : ${res.errorMessage}`,
      );

      return {
        value: '0x00',
        amount: '0',
      };
    }

    const value = utils.toHex(
      utils.safeParseJSON(res.succeedData)?.balance as number,
    );
    if (!withAmount) {
      return { value };
    }

    return {
      value: value,
      amount: await this.amountByAssetIdAndValue(assetId, value),
    };
  }
}

export const helper = new AssetHelper();
