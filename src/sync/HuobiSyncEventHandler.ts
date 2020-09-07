import { logger } from '@muta-extra/hermit-purple';
import {
  DefaultSyncEventHandler,
  Knex,
  TableNames,
} from '@muta-extra/knex-mysql';
import { Executed } from '@muta-extra/synchronizer';
import { RustToTS } from '@mutadev/service';
import {
  AdmissionControlService,
  AssetService,
  GovernanceService,
  KycService,
} from 'huobi-chain-sdk';
import { Asset as AssetStruct } from 'huobi-chain-sdk/lib/services/AssetService';
import { ASSET, BALANCE, TRANSFER } from '../db-mysql/constants';
import { Account, Balance } from '../types';
import { FeeResolver } from './FeeResolver';
import { TransactionResolver } from './TransactionResolver';

const debug = logger.debug;
const info = logger.info;

type Asset = RustToTS<typeof AssetStruct>;

export class HuobiSyncEventHandler extends DefaultSyncEventHandler {
  private defaultHandler = new DefaultSyncEventHandler();

  /**
   * save the native asset
   */
  private async genesisNativeAsset(): Promise<Asset> {
    const assetData = await new AssetService().read.get_native_asset();
    const asset = assetData.succeedData;
    // const supply = utils.toHex(asset.supply);
    await this.knex
      .insert({
        assetId: asset.id,
        name: asset.name,
        symbol: asset.symbol,
        // supply: supply,
        account: asset.admin,
        txHash: '',
        precision: asset.precision,
      })
      .into(ASSET);
    return asset;
  }

  private async genesisAddresses(nativeAssetId: string) {
    const governanceService = new GovernanceService();
    const admissionControlService = new AdmissionControlService();

    const [
      minerChargeMap,
      minerProfitOutlet,
      admissionAdmin,
      kycAdmin,
    ] = await Promise.all([
      governanceService.read.get_miner_charge_map(),
      governanceService.read.get_miner_profit_outlet_address(),
      admissionControlService.read.get_admin(),
      new KycService().read.get_admin(),
    ]);

    const addresses: string[] =
      // governance charge map
      minerChargeMap.succeedData
        .flatMap<string>((charge) => [
          charge.miner_charge_address,
          charge.address,
        ])
        .concat([minerProfitOutlet.succeedData])
        .concat([minerProfitOutlet.succeedData])
        .concat([admissionAdmin.succeedData])
        .concat([kycAdmin.succeedData]);

    const balances = addresses.map<Balance>((address) => ({
      address,
      assetId: nativeAssetId,
    }));
    await this.knex.transaction((trx) => this.saveBalances(balances, trx));
  }

  onGenesis = async (): Promise<void> => {
    const asset = await this.genesisNativeAsset();
    await this.genesisAddresses(asset.id);
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
    await this.saveBalances(balances, trx);

    const accounts = resolver.getRelevantAccount();
    await this.saveAccounts(accounts, trx);
  }

  private async saveAccounts(accounts: Account[], trx: Knex.Transaction) {
    for (let account of accounts) {
      await trx.insert(account).into('account').onDuplicateUpdate('address');
    }
  }

  private async saveBalances(balances: Balance[], trx: Knex.Transaction) {
    for (let balance of balances) {
      await trx
        .insert(balance)
        .into(BALANCE)
        .onDuplicateUpdate('address', 'asset_id');
    }
  }
}
