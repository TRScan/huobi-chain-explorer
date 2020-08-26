#!/usr/bin/env node
require('@muta-extra/hermit-purple').loadEnvFile();

import { DefaultLocalFetcher } from '@muta-extra/knex-mysql';
import {
  DefaultRemoteFetcher,
  ISyncEventHandlerAdapter,
  ISynchronizerAdapter,
  PollingSynchronizer,
} from '@muta-extra/synchronizer';
import { HuobiSyncEventHandler } from './sync/HuobiSyncEventHandler';
import { context } from './sync/SyncContext';

async function main() {
  const service = context.get('assetService');
  const asset = await service.read.get_native_asset();

  context.set('nativeAssetId', asset.succeedData.id);

  const remoteFetcher = new DefaultRemoteFetcher();
  const localFetcher = new DefaultLocalFetcher();
  const eventHandler: ISyncEventHandlerAdapter = new HuobiSyncEventHandler();

  const adapter: ISynchronizerAdapter = {
    ...localFetcher,
    ...remoteFetcher,
    ...eventHandler,
  };
  new PollingSynchronizer(adapter).run();
}

main();
