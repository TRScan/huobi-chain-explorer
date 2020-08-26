import {
  Account as DBAccount,
  Balance as DBBalance,
  Transaction as DBTransaction,
  Transfer as DBTransfer,
} from './generated/types';

type WithoutID<T, ID extends string = 'id'> = Omit<T, ID>;

export type Transfer = WithoutID<DBTransfer>;
export type Account = WithoutID<DBAccount>;
export type Balance = WithoutID<DBBalance>;
export type Transaction = WithoutID<DBTransaction>;

export type Asset = {
  account: string;
  assetId: string;
  name: string;
  supply: string;
  precision: number;
  symbol: string;
  txHash: string;
};

export type AssetAmount = {
  assetId: string;
  value: string;
};
