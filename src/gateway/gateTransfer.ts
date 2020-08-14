import { envStr } from '@muta-extra/hermit-purple';
import { types } from '@mutadev/muta-sdk';
import bodyParser from 'body-parser';
import { Express } from 'express';
import { readFileSync } from 'fs';
import { buildSchema, parse, validate } from 'graphql';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { join } from 'path';

interface Config {
  path: string;
}

const schema = buildSchema(
  readFileSync(join(__dirname, 'huobi-chain.graphql')).toString(),
);

export function gateTransfer(
  app: Express,
  config: Config = { path: envStr('BYPASS_URL', '/chain') },
) {
  app.use(
    config.path,
    bodyParser.json(),
    createProxyMiddleware({
      target: envStr('MUTA_ENDPOINT', 'http://127.0.0.1:8000/graphql'),
      changeOrigin: true,
      pathRewrite: {
        [`^${config.path}`]: '',
      },

      onProxyReq: (proxyReq, req, res) => {
        try {
          const document = parse(req.body?.query);
          const errors = validate(schema, document);

          if (errors.length > 0) {
            res.status(400).send(errors);
            return;
          }
        } catch {
          res.status(400).send('wrong request');
          return;
        }

        const inputRaw: types.Transaction = req.body.variables.inputRaw;

        if (
          inputRaw?.serviceName === 'asset' &&
          inputRaw?.method === 'transfer'
        ) {
          const bodyData = JSON.stringify(req.body);

          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        } else {
          res.status(400).send('wrong service or method');
        }
      },
    }),
  );
}
