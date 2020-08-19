require('@muta-extra/hermit-purple').loadEnvFile();

import {
  envNum,
  envStr,
  extendService,
  makeSchema,
} from '@muta-extra/hermit-purple';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import path from 'path';
import { gateTransfer } from './gateway/gateTransfer';
import { types } from './schema';
import { HuobiService } from './service';

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

gateTransfer(app);
server.applyMiddleware({
  app, cors: { origin: envStr('HERMIT_CORS_ORIGIN', '') },
});

app.listen({ port }, () =>
  console.log(
    `🚀 Server ready at http://localhost:${port}${server.graphqlPath}`,
  ),
);
