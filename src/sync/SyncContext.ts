import { AssetService } from 'huobi-chain-sdk';

type ISyncContext<T> = {
  get<Key extends keyof T>(key: Key): T[Key];
  set<Key extends keyof T>(key: Key, value: T[Key]): void;
};

function createSyncContext<T>(context: T): ISyncContext<T> {
  return new Map(Object.entries(context)) as ISyncContext<T>;
}

export const context = createSyncContext({
  nativeAssetId: '',
  assetService: new AssetService(),
});
