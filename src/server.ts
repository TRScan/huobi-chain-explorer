#!/usr/bin/env node
require('@muta-extra/hermit-purple').loadEnvFile();

import {
  envNum,
  envStr,
  extendService,
  makeSchema,
} from '@muta-extra/hermit-purple';
import { ApolloServer } from 'apollo-server-express';
import cors from 'cors';
import express from 'express';
import path from 'path';
import { allowOptions } from './gateway/allow-options';
import { applyMiddleware as applyAllowTransferMiddleware } from './gateway/allow-transfer';
import { init } from './init';
import { types } from './schema';
import { HuobiService } from './service';

async function main() {
  init();
  const schema = makeSchema({
    types,
    outputs: {
      schema: path.join(__dirname, 'generated/api.graphql'),
    },
  });

  const services = extendService(new HuobiService());

  const server = new ApolloServer({
    schema,
    context: { ...services },
  });

  const port = envNum('HERMIT_PORT', 4040);
  const app = express();

const origin = envStr('HERMIT_CORS_ORIGIN', '');
app.use('/graphql', cors({
  origin,
  methods: ['OPTIONS', 'GET', 'POST'],
}), allowOptions());

  applyAllowTransferMiddleware(app);
  server.applyMiddleware({ app, cors: { origin } });

  app.listen({ port }, () =>
    console.log(
      `🚀 Server ready at http://localhost:${port}${server.graphqlPath}`,
    ),
  );
}

main();
