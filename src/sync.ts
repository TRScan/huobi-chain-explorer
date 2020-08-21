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


const remoteFetcher = new DefaultRemoteFetcher();
const localFetcher = new DefaultLocalFetcher();
const eventHandler: ISyncEventHandlerAdapter = new HuobiSyncEventHandler();

const adapter: ISynchronizerAdapter = {
  ...localFetcher,
  ...remoteFetcher,
  ...eventHandler,
};

new PollingSynchronizer(adapter).run();
