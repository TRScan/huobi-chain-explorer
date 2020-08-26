import { utils } from '@mutadev/muta-sdk';
import { RustToTS } from '@mutadev/service';
import { Asset } from 'huobi-chain-sdk/lib/services/AssetService';
import { Asset as AssetModel } from '../../types';

type ChainAsset = RustToTS<typeof Asset>;

export function chainAssetToAssetModel(asset: ChainAsset, txHash = ''): AssetModel {
  return {
    precision: Number(asset.precision),
    account: asset.admin,
    name: asset.name,
    txHash,
    symbol: asset.symbol,
    assetId: asset.id,
    supply: utils.toHex(asset.supply),
  };
}
