// AUTO-GENERATED FILE - DO NOT EDIT! 
// @ts-nocheck 
/* tslint:disable */


export namespace AccountFields {
    export type id = number;
    export type address = string;

}

export interface Account {
    id: AccountFields.id;
    address: AccountFields.address;

}

export namespace AssetFields {
    export type id = number;
    export type account = string;
    export type assetId = string;
    export type name = string;
    export type supply = string;
    export type precision = number;
    export type symbol = string;
    export type txHash = string;

}

export interface Asset {
    id: AssetFields.id;
    account: AssetFields.account;
    assetId: AssetFields.assetId;
    name: AssetFields.name;
    supply: AssetFields.supply;
    precision: AssetFields.precision;
    symbol: AssetFields.symbol;
    txHash: AssetFields.txHash;

}

export namespace BalanceFields {
    export type id = number;
    export type address = string;
    export type assetId = string;
    export type balance = string;

}

export interface Balance {
    id: BalanceFields.id;
    address: BalanceFields.address;
    assetId: BalanceFields.assetId;
    balance: BalanceFields.balance;

}

export namespace BlockFields {
    export type id = number;
    export type height = number | null;
    export type execHeight = number;
    export type blockHash = string;
    export type orderRoot = string;
    export type prevHash = string;
    export type proofBitmap = string;
    export type proofRound = string;
    export type proofSignature = string;
    export type proposer = string;
    export type stateRoot = string;
    export type timestamp = string;
    export type transactionsCount = number;
    export type validatorVersion = string;

}

export interface Block {
    id: BlockFields.id;
    height: BlockFields.height;
    execHeight: BlockFields.execHeight;
    blockHash: BlockFields.blockHash;
    orderRoot: BlockFields.orderRoot;
    prevHash: BlockFields.prevHash;
    proofBitmap: BlockFields.proofBitmap;
    proofRound: BlockFields.proofRound;
    proofSignature: BlockFields.proofSignature;
    proposer: BlockFields.proposer;
    stateRoot: BlockFields.stateRoot;
    timestamp: BlockFields.timestamp;
    transactionsCount: BlockFields.transactionsCount;
    validatorVersion: BlockFields.validatorVersion;

}

export namespace BlockValidatorFields {
    export type id = number;
    export type pubkey = string;
    export type proposeWeight = number;
    export type version = string;
    export type voteWeight = number;

}

export interface BlockValidator {
    id: BlockValidatorFields.id;
    pubkey: BlockValidatorFields.pubkey;
    proposeWeight: BlockValidatorFields.proposeWeight;
    version: BlockValidatorFields.version;
    voteWeight: BlockValidatorFields.voteWeight;

}

export namespace EventFields {
    export type id = number;
    export type data = string;
    export type txHash = string;
    export type service = string;
    export type name = string;

}

export interface Event {
    id: EventFields.id;
    data: EventFields.data;
    txHash: EventFields.txHash;
    service: EventFields.service;
    name: EventFields.name;

}

export namespace ReceiptFields {
    export type id = number;
    export type block = number;
    export type cyclesUsed = string;
    export type isError = boolean;
    export type ret = string;
    export type txHash = string;

}

export interface Receipt {
    id: ReceiptFields.id;
    block: ReceiptFields.block;
    cyclesUsed: ReceiptFields.cyclesUsed;
    isError: ReceiptFields.isError;
    ret: ReceiptFields.ret;
    txHash: ReceiptFields.txHash;

}

export namespace TransactionFields {
    export type id = number;
    export type block = number;
    export type chainId = string;
    export type cyclesLimit = string;
    export type cyclesPrice = string;
    export type sender = string;
    export type method = string;
    export type nonce = string;
    export type order = number | null;
    export type payload = string;
    export type pubkey = string;
    export type serviceName = string;
    export type signature = string;
    export type timeout = string;
    export type txHash = string;
    export type fee = string;
    export type timestamp = string;

}

export interface Transaction {
    id: TransactionFields.id;
    block: TransactionFields.block;
    chainId: TransactionFields.chainId;
    cyclesLimit: TransactionFields.cyclesLimit;
    cyclesPrice: TransactionFields.cyclesPrice;
    sender: TransactionFields.sender;
    method: TransactionFields.method;
    nonce: TransactionFields.nonce;
    order: TransactionFields.order;
    payload: TransactionFields.payload;
    pubkey: TransactionFields.pubkey;
    serviceName: TransactionFields.serviceName;
    signature: TransactionFields.signature;
    timeout: TransactionFields.timeout;
    txHash: TransactionFields.txHash;
    fee: TransactionFields.fee;
    timestamp: TransactionFields.timestamp;

}

export namespace TransferFields {
    export type id = number;
    export type asset = string;
    export type from = string;
    export type to = string;
    export type txHash = string;
    export type value = string;
    export type amount = string;
    export type block = number;
    export type timestamp = string;
    export type fee = string;

}

export interface Transfer {
    id: TransferFields.id;
    asset: TransferFields.asset;
    from: TransferFields.from;
    to: TransferFields.to;
    txHash: TransferFields.txHash;
    value: TransferFields.value;
    amount: TransferFields.amount;
    block: TransferFields.block;
    timestamp: TransferFields.timestamp;
    fee: TransferFields.fee;

}
