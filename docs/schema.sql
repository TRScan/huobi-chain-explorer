create table t_block (
    id int unsigned not null auto_increment primary key comment 'id',
    height int comment 'block height in decimal',
    exec_height int comment 'exec_height in decimal',
    block_hash varchar(66) not null default '' comment 'hash value formatted as 66 length hex',
    order_root varchar(66) not null default '' comment 'hash value formatted as 66 length hex',
    prev_hash varchar(66) not null default '' comment 'hash value formatted as 66 length hex',
    proof_bitmap varchar(1024) not null default '' comment 'a value formatted as unknown length hex',
    proof_round varchar(18) not null default '' comment 'a u64 value formatted as 18 length hex',
    proof_signature varchar(2050) not null default '' comment 'a value formatted as unknown length hex',
    proposer varchar(68) not null default '' comment 'an bech32 encoded address value',
    state_root varchar(66) not null default '' comment 'hash value formatted as 66 length hex',
    f_timestamp varchar(18) not null default '' comment 'a u64 value formatted as 18 length hex',
    transactions_count int not null comment 'Number of transactions in the block',
    validator_version varchar(18) not null default '' comment 'a u64 value formatted as 18 length hex'
) default character set utf8 engine = InnoDB;
alter table t_block
add unique uniq_block_height(height);
create table t_transaction (
    id bigint unsigned not null auto_increment primary key comment 'id',
    block_height int not null comment 'The block height',
    chain_id varchar(66) not null default '' comment 'hash value formatted as 66 length hex',
    cycles_limit varchar(18) not null default '' comment 'a u64 value formatted as 18 length hex',
    cycles_price varchar(18) not null default '' comment 'a u64 value formatted as 18 length hex',
    sender varchar(68) not null default '' comment 'an bech32 encoded address value',
    method varchar(255) not null default '' comment 'a text value',
    nonce varchar(66) not null default '' comment 'hash value formatted as 66 length hex',
    sequence bigint comment 'transaction sequence number',
    payload mediumtext comment 'stringify data, maybe a JSON string',
    pubkey varchar(552) not null default '' comment 'a value formatted as unknown length hex',
    service_name varchar(255) not null default '' comment 'a text value',
    signature varchar(1128) not null default '' comment 'an RPL-encoded array of Secp256k1 signature, up to 8 signatures in a transaction',
    timeout varchar(18) not null default '' comment 'a u64 value formatted as 18 length hex',
    tx_hash varchar(66) not null default '' comment 'hash value formatted as 66 length hex'
) default character set utf8mb4 engine = InnoDB;
alter table t_transaction
add index idx_transaction_block(block_height);
alter table t_transaction
add unique uniq_transaction_sequence(sequence);
alter table t_transaction
add unique uniq_transaction_tx_hash(tx_hash);
create table t_receipt (
    id bigint unsigned not null auto_increment primary key comment 'id',
    block_height int comment 'link to block height',
    cycles_used varchar(18) not null default '' comment 'a u64 value formatted as 18 length hex',
    is_error boolean comment 'mark the receipt is error',
    ret mediumtext comment 'stringify data, maybe a JSON string',
    tx_hash varchar(66) not null default '' comment 'hash value formatted as 66 length hex'
) default character set utf8mb4 engine = InnoDB;
alter table t_receipt
add unique uniq_receipt_tx_hash(tx_hash);
create table t_event (
    id bigint unsigned not null auto_increment primary key comment 'id',
    f_data mediumtext comment 'stringify data, maybe a JSON string',
    tx_hash varchar(66) not null default '' comment 'link to transaction_tx_hash',
    service varchar(255) not null default '' comment 'a text value',
    f_name varchar(255) not null default '' comment 'a text value'
) default character set utf8 engine = InnoDB;
create table t_block_validator (
    id int unsigned not null auto_increment primary key comment 'id',
    pubkey varchar(68) not null default '' comment 'a value formatted as unknown length hex',
    propose_weight int not null comment 'propose weight',
    version varchar(18) not null default '' comment 'a u64 value formatted as 18 length hex',
    vote_weight int not null comment 'vote weight'
) default character set utf8 engine = InnoDB;
alter table t_block_validator
add unique uniq_block_validator_pubkey_version(pubkey, version);
create table t_sync_lock (
    id int unsigned not null auto_increment primary key comment 'id',
    is_locked boolean comment 'true if it is locked',
    version bigint comment 'version will be +1 when updated',
    updated_at bigint comment 'last update since'
) default character set utf8 engine = InnoDB;
alter table t_transaction
add fee varchar(18) NOT NULL not null default '' comment 'transaction fee',
    add f_timestamp varchar(18) NOT NULL not null default '' comment 'mined time';
create table t_asset (
    id int unsigned not null auto_increment primary key comment 'id',
    f_account varchar(68) not null default '' comment 'an bech32 encoded address value',
    asset_id varchar(66) not null default '' comment 'hash value formatted as 66 length hex',
    f_name varchar(255) not null default '' comment 'a text value',
    f_precision int not null comment 'asset precision',
    symbol varchar(255) not null default '' comment 'a text value',
    tx_hash varchar(66) not null default '' comment 'link to transaction tx_hash'
) default character set utf8 engine = InnoDB;
alter table t_asset
add unique uniq_asset_asset_id(asset_id);
create table t_transfer (
    id bigint unsigned not null auto_increment primary key comment 'id',
    asset varchar(66) not null default '' comment 'hash value formatted as 66 length hex',
    f_from varchar(68) not null default '' comment 'an bech32 encoded address value',
    f_to varchar(68) not null default '' comment 'an bech32 encoded address value',
    tx_hash varchar(66) not null default '' comment 'hash value formatted as 66 length hex',
    f_value varchar(18) not null default '' comment 'a u64 value formatted as 18 length hex',
    f_block int not null comment 'The block height',
    f_timestamp varchar(18) NOT NULL comment 'mined timestamp',
    fee varchar(18) NOT NULL comment 'transfer fee'
) default character set utf8 engine = InnoDB;
alter table t_transfer
add index idx_transfer_asset(asset);
alter table t_transfer
add index idx_transfer_from(f_from);
alter table t_transfer
add index idx_transfer_to(f_to);
alter table t_transfer
add index idx_transfer_tx_hash(tx_hash);
alter table t_transfer
add index idx_transfer_block(f_block);
create table t_balance (
    id bigint unsigned not null auto_increment primary key comment 'id',
    address varchar(68) not null default '' comment 'an bech32 encoded address value',
    asset_id varchar(66) not null default '' comment 'hash value formatted as 66 length hex'
) default character set utf8 engine = InnoDB;
alter table t_balance
add index idx_balance_address(address);
alter table t_balance
add index idx_balance_asset_id(asset_id);
alter table t_balance
add unique uniq_balance_address_asset_id(address, asset_id);
create table t_account (
    id int unsigned not null auto_increment primary key comment 'id',
    address varchar(68) not null default '' comment 'an bech32 encoded address value'
) default character set utf8 engine = InnoDB;
alter table t_account
add unique uniq_account_address(address)