import { utils } from '@mutadev/muta-sdk';
import { BigNumber } from '@mutadev/shared';
import { AssetModelFetcher } from './AssetModelFetcher';

BigNumber.config({ EXPONENTIAL_AT: 38 });

export function toAmount(
  value: string | number | BigNumber,
  precision: number,
) {
  return new BigNumber(value).shiftedBy(-precision).toString();
}

export class AssetAmountHelper {
  constructor(public fetcher: AssetModelFetcher) {}

  async getAmount(
    assetId: string,
    value: string | number | BigNumber,
  ): Promise<string> {
    const asset = await this.fetcher.findOne(assetId);
    if (!asset) return '0';
    return toAmount(value, asset.precision);
  }

  async getBalance(assetId: string, user: string): Promise<string> {
    const res = await this.fetcher.assetService.read.get_balance({
      asset_id: assetId,
      user,
    });

    return utils.toHex(res.succeedData.balance);
  }
}
