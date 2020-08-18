#!/usr/bin/env node
require('@muta-extra/hermit-purple').loadEnvFile();

import { logger, TransactionModel } from '@muta-extra/hermit-purple';

import {
  DefaultLocalFetcher,
  DefaultSyncEventHandler,
  Knex,
  TableNames,
} from '@muta-extra/knex-mysql';
import {
  DefaultRemoteFetcher,
  Executed,
  ISynchronizerAdapter,
  PollingSynchronizer,
} from '@muta-extra/synchronizer';
import { ASSET, BALANCE, TRANSFER } from './db-mysql/constants';
import { FeeResolver } from './sync/FeeResolver';
import { TransactionResolver } from './sync/TransactionResolver';

const debug = logger.debug;
const info = logger.info;

class HuobiSyncEventHandler extends DefaultSyncEventHandler {
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

  async saveTransactions(
    trx: Knex.Transaction,
    txs: TransactionModel[],
  ): Promise<{}> {
    return {};
  }

  async saveExecutedBlock(
    trx: Knex.Transaction,
    executed: Executed,
  ): Promise<void> {
    const block = executed.getBlock();
    await this.saveBlock(trx, block);

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
    await this.saveReceipts(trx, receipts);
    info(`${receipts.length} receipts prepared`);

    const events = executed.getEvents();
    await this.saveEvents(trx, events);
    info(`${events.length} events prepared`);

    for (let validator of executed.getValidators()) {
      await trx
        .insert(validator)
        .into(TableNames.BLOCK_VALIDATOR)
        .onDuplicateUpdate('pubkey', 'version');
    }

    await this.saveResolved(trx, executed);
  }
}

const remoteFetcher = new DefaultRemoteFetcher();
const localFetcher = new DefaultLocalFetcher();
const eventHandler = new HuobiSyncEventHandler();

const adapter: ISynchronizerAdapter = {
  ...localFetcher,
  ...remoteFetcher,
  ...eventHandler,
};

new PollingSynchronizer(adapter).run();
