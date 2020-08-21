import { logger } from '@muta-extra/hermit-purple';
import {
  DefaultSyncEventHandler,
  Knex,
  TableNames,
} from '@muta-extra/knex-mysql';
import { Executed } from '@muta-extra/synchronizer';
import { utils } from '@mutadev/muta-sdk';
import { BigNumber } from '@mutadev/shared';
import { ASSET, BALANCE, TRANSFER } from '../db-mysql/constants';
import { client } from '../muta';
import { FeeResolver } from './FeeResolver';
import { TransactionResolver } from './TransactionResolver';

const debug = logger.debug;
const info = logger.info;

interface AssetReceipt {
  id: string;
  name: string;
  symbol: string;
  supply: number | BigNumber;
  precision: number;
  admin: string;
  relayable: boolean;
}


export class HuobiSyncEventHandler extends DefaultSyncEventHandler {
  private defaultHandler = new DefaultSyncEventHandler();

  onGenesis = async (): Promise<void> => {
    const res = await client.queryService({
      serviceName: 'asset',
      method: 'get_native_asset',
      payload: '',
    });

    const asset: AssetReceipt = utils.safeParseJSON(res.succeedData);
    const supply = '0x' + new BigNumber(asset.supply).toString(16);
    await this.knex.insert({
      assetId: asset.id,
      name: asset.name,
      symbol: asset.symbol,
      supply: supply,
      account: asset.admin,
      txHash: '',
      precision: asset.precision,
    }).into(ASSET);
  };


  async saveExecutedBlock(
    trx: Knex.Transaction,
    executed: Executed,
  ): Promise<void> {
    const block = executed.getBlock();
    await this.defaultHandler.saveBlock(trx, block);

    const transactions = executed.getTransactions();
    const feeResolver = new FeeResolver(executed.getEvents());
    trx.batchInsert(
      TableNames.TRANSACTION,
      transactions.map((tx) => ({
        ...tx,
        fee: feeResolver.feeByTxHash(tx.txHash),
        timestamp: block.timestamp,
      })),
    );

    info(`${transactions.length} transactions prepared`);

    const receipts = executed.getReceipts();
    await this.defaultHandler.saveReceipts(trx, receipts);
    info(`${receipts.length} receipts prepared`);

    const events = executed.getEvents();
    await this.defaultHandler.saveEvents(trx, events);
    info(`${events.length} events prepared`);

    for (let validator of executed.getValidators()) {
      await trx
        .insert(validator)
        .into(TableNames.BLOCK_VALIDATOR)
        .onDuplicateUpdate('pubkey', 'version');
    }

    await this.saveResolved(trx, executed);
  }

  private async saveResolved(trx: Knex.Transaction, executed: Executed) {
    const transactions = executed.getTransactions();
    const receipts = executed.getReceipts();
    const events = executed.getEvents();

    const resolver = new TransactionResolver({
      transactions,
      receipts,
      events,
      height: executed.height(),
      timestamp: executed.getBlock().timestamp,
    });
    await resolver.resolve();

    debug(`transaction resolved to exact operation`);

    const createdAssets = resolver.getCreatedAssets();

    for (let asset of createdAssets) {
      await trx.insert(asset).into(ASSET).onDuplicateUpdate('asset_id');
    }

    const transfers = resolver.getTransfers();
    if (transfers.length) {
      await trx.batchInsert(TRANSFER, transfers).transacting(trx);
    }
    debug(`${transfers.length} transfers prepared`);

    const balances = resolver.getBalances();
    for (let balance of balances) {
      await trx
        .insert(balance)
        .into(BALANCE)
        .onDuplicateUpdate('address', 'asset_id');
    }

    const accounts = resolver.getRelevantAccount();

    for (let account of accounts) {
      await trx.insert(account).into('account').onDuplicateUpdate('address');
    }
  }
}