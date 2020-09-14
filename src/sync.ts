// #!/usr/bin/env node
// require('@muta-extra/hermit-purple').loadEnvFile();

import { applyAPMMiddleware } from '@muta-extra/apm';
import { envNum } from '@muta-extra/hermit-purple';
import {
  DefaultLocalFetcher,
  DefaultLocker,
  getKnexInstance,
} from '@muta-extra/knex-mysql';
import {
  DefaultRemoteFetcher,
  ISyncEventHandlerAdapter,
  ISynchronizerAdapter,
  PollingSynchronizer,
} from '@muta-extra/synchronizer';
import { Client } from '@mutadev/muta-sdk';
import express from 'express';
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
  new PollingSynchronizer({
    adapter,
    client: new Client(),
    locker: new DefaultLocker(getKnexInstance()),
  }).run();

  const port = envNum('HERMIT_PORT', 0);
  if (port) {
    const app = express();
    applyAPMMiddleware(app);
    app.listen(port, () => {
      console.log(`sync started at http://localhost:${port}/metrics`);
    });
  }
}

main();
