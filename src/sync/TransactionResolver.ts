import {
  EventModel,
  ReceiptModel,
  TransactionModel,
} from '@muta-extra/hermit-purple';
import { utils } from '@mutadev/muta-sdk';
import { Uint64 } from '@mutadev/types';
import BigNumber from 'bignumber.js';
import { Asset } from '../generated/types';
import { Account, Balance, Transfer } from '../types';
import { FeeResolver } from './FeeResolver';
import { context } from './SyncContext';

type WithoutID<T, ID extends string = 'id'> = Omit<T, ID>;
type NonIDAsset = WithoutID<Asset>;
type TransactionWithoutOrder = Omit<TransactionModel, 'order'>;

interface MintAssetPayload {
  asset_id: string;
  to: string;
  amount: number | BigNumber;
  proof: string;
  memo: string;
}

interface BurnPayload {
  asset_id: string;
  amount: number | BigNumber;
}

interface TransactionResolverOptions {
  height: number;
  timestamp: Uint64;
  transactions: TransactionWithoutOrder[];
  receipts: ReceiptModel[];
  events: EventModel[];
}

export class TransactionResolver {
  private readonly txs: TransactionWithoutOrder[];

  private readonly receipts: ReceiptModel[];

  private readonly transfers: Transfer[];

  private readonly assets: NonIDAsset[];

  private readonly balances: Balance[];

  private readonly events: EventModel[];

  private readonly accounts: Set<string>;

  /**
   * This set is used to ensure that the balance
   * will not be updated repeatedly
   */
  private readonly balanceTask: Set<string>; // address + assetId
  private readonly height: number;
  private readonly timestamp: string;

  constructor(options: TransactionResolverOptions) {
    const { transactions, receipts, height, timestamp, events } = options;
    this.height = height;
    this.timestamp = timestamp;
    this.txs = transactions;
    this.receipts = receipts;
    this.events = events;

    this.transfers = [];
    this.assets = [];
    this.balances = [];
    this.balanceTask = new Set();
    this.accounts = new Set();
  }

  async resolve() {
    await this.walk();
  }

  getRelevantAccount(): Account[] {
    return Array.from(this.accounts).map((address) => ({ address }));
  }

  getCreatedAssets(): NonIDAsset[] {
    return this.assets;
  }

  getTransfers(): Transfer[] {
    return this.transfers;
  }

  getBalances(): Balance[] {
    return this.balances;
  }

  private enqueueTransfer(transfer: Transfer) {
    this.transfers.push(transfer);
  }

  private enqueueAsset(asset: NonIDAsset) {
    // assetHelper.cacheAsset(asset);
    this.assets.push(asset);
  }

  private enqueueBalance(address: string, assetId: string) {
    this.accounts.add(address);
    if (this.balanceTask.has(address + assetId)) {
      return;
    }
    this.balanceTask.add(address + assetId);

    this.balances.push({
      address,
      assetId: context.get('nativeAssetId'),
    });

    this.balances.push({
      address,
      assetId,
    });
  }

  private async assembleTransfer(
    payload: {
      asset_id: string;
      to: string;
      value: string | number | BigNumber;
    },
    from: string,
    txHash: string,
    feeResolver: FeeResolver,
  ): Promise<Transfer> {
    return {
      assetId: payload.asset_id,
      from: from,
      to: payload.to,
      txHash,
      value: utils.toHex(payload.value),
      blockHeight: this.height,
      timestamp: this.timestamp,
      fee: feeResolver.feeByTxHash(txHash),
    };
  }

  private async walk() {
    const { txs, receipts, events } = this;
    const feeResolver = new FeeResolver(events);

    const len = txs.length;

    for (let i = 0; i < len; i++) {
      const tx = txs[i];
      const receipt = receipts[i];

      const txHash = tx.txHash;
      const from: string = tx.sender;

      const { serviceName, method, payload: payloadStr } = tx;
      if (receipt.isError || serviceName !== 'asset') return;

      if (method === 'transfer') {
        const payload = utils.safeParseJSON(payloadStr);
        this.enqueueTransfer(
          await this.assembleTransfer(payload, from, txHash, feeResolver),
        );

        this.enqueueBalance(from, payload.asset_id);
        this.enqueueBalance(payload.to, payload.asset_id);
      }

      if (method === 'transfer_from') {
        const payload = utils.safeParseJSON(payloadStr);

        this.enqueueTransfer(
          await this.assembleTransfer(
            { to: payload.recipient, ...payload },
            from,
            txHash,
            feeResolver,
          ),
        );

        this.enqueueBalance(from, payload.asset_id);
        this.enqueueBalance(payload.recipient, payload.asset_id);
        this.enqueueBalance(payload.sender, payload.asset_id);
      }

      if (method === 'mint') {
        const payload: MintAssetPayload = utils.safeParseJSON(payloadStr);
        this.enqueueBalance(from, payload.asset_id);
        this.enqueueBalance(payload.to, payload.asset_id);
      }

      if (method === 'burn' || method === 'relay') {
        const payload: BurnPayload = utils.safeParseJSON(payloadStr);
        this.enqueueBalance(from, payload.asset_id);
      }

      if (method === 'create_asset') {
        const payload = utils.safeParseJSON(receipt.ret);
        const precision = Number(payload.precision);
        this.enqueueAsset({
          assetId: payload.id,
          name: payload.name,
          symbol: payload.symbol,
          account: from,
          txHash,
          precision,
        });

        this.enqueueBalance(from, payload.id);
      }
    }
  }
}
