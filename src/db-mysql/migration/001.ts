import { enhanceBuilder, Migration001 } from '@muta-extra/hermit-purple';
import { TableNames } from '@muta-extra/knex-mysql';

import { ACCOUNT, ASSET, BALANCE, TRANSFER } from '../constants';

export class HuobiMigration001 extends Migration001 {
  constructor() {
    super();
  }

  up() {
    return super
      .up()
      .alterTable(TableNames.TRANSACTION, (table) => {
        table
          .specificType('fee', 'varchar(18) NOT NULL')
          .notNullable()
          .defaultTo('')
          .comment('transaction fee');

        table
          .specificType('f_timestamp', 'varchar(18) NOT NULL')
          .notNullable()
          .defaultTo('')
          .comment('mined time');
      })
      .createTable(ASSET, (rawBuilder) => {
        const table = enhanceBuilder(rawBuilder);

        table.address('account');

        table.hash('asset_id').unique('uniq_asset_asset_id');

        table.unfixedText('name');

        // table.specificType('supply', 'varchar(18) NOT NULL');

        table.integer('precision').notNullable().comment('asset precision');

        table.unfixedText('symbol');

        table.hash('tx_hash').comment('link to transaction tx_hash');
      })
      .createTable(TRANSFER, (rawBuilder) => {
        const table = enhanceBuilder(rawBuilder, { bigIncrements: true });

        table.hash('asset').index('idx_transfer_asset');

        table.address('from').index('idx_transfer_from');

        table.address('to').index('idx_transfer_to');

        table.hash('tx_hash').index('idx_transfer_tx_hash');

        table.u64('value');

        // table
        //   .text('amount')
        //   .notNullable()
        //   .comment('transfer amount with precision');

        table
          .integer('block')
          .index('idx_transfer_block')
          .notNullable()
          .comment('The block height');

        table
          .specificType('timestamp', 'varchar(18) NOT NULL')
          .comment('mined timestamp');

        table
          .specificType('fee', 'varchar(18) NOT NULL')
          .comment('transfer fee');
      })
      .createTable(BALANCE, (rawBuilder) => {
        const table = enhanceBuilder(rawBuilder, { bigIncrements: true });

        table.address('address').index('idx_balance_address');

        table.hash('asset_id').index('idx_balance_asset_id');

        // table.specificType('balance', 'varchar(18) NOT NULL');

        table.unique(['address', 'asset_id'], 'uniq_balance_address_asset_id');
      })
      .createTable(ACCOUNT, (rawBuilder) => {
        const table = enhanceBuilder(rawBuilder);

        table.address('address').unique('uniq_account_address');
      });
  }

  down() {
    return super
      .down()
      .dropTableIfExists(ASSET)
      .dropTableIfExists(TRANSFER)
      .dropTableIfExists(BALANCE)
      .dropTableIfExists(ACCOUNT);
  }
}
