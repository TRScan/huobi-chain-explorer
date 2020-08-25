import { schema } from '@muta-extra/hermit-purple';
import { GraphQLError } from 'graphql';
import { helper } from '../helpers/AssetHelper';
import { pageArgs } from './common';

export const Transfer = schema.objectType({
  name: 'Transfer',
  definition(t) {
    t.int('block');

    t.field('timestamp', {
      type: 'Timestamp',
      description: 'A datetime string format as UTC string',
      async resolve(parent, args, ctx) {
        const block = await ctx.blockService.findByHeight(parent.block);
        return block?.timestamp ?? '';
      },
    });

    t.field('transaction', {
      type: 'Transaction',
      nullable: true,
      // @ts-ignore
      resolve(parent, args, ctx) {
        return ctx.transactionService.findByTxHash(parent.txHash);
      },
    });

    t.field('value', { type: 'Uint64' });

    t.field('txHash', { type: 'Hash' });

    t.field('from', { type: 'Address' });

    t.field('to', { type: 'Address' });

    t.field('fee', { type: 'Uint64', description: 'transaction fee' });

    t.string('amount', {
      resolve(parent) {
        return helper.amountByAssetIdAndValue(parent.asset, parent.value);
      },
    });

    t.field('asset', {
      type: 'Asset',
      nullable: true,
      //@ts-ignore
      resolve(parent, args, ctx) {
        return ctx.assetService.findByAssetId(parent.asset);
      },
    });
  },
});

export const transferQuery = schema.queryField((t) => {
  t.field('transfer', {
    type: Transfer,
    args: {
      txHash: schema.arg({ type: 'Hash' }),
    },
    nullable: true,
    resolve(parent, args, ctx) {
      return ctx.transferService.findByTxHash(args.txHash!);
    },
  });
});

export const transferPagination = schema.queryField((t) => {
  t.list.field('transfers', {
    type: 'Transfer',
    nullable: true,
    args: {
      ...pageArgs,
      fromOrTo: schema.arg({
        type: 'Address',
      }),
      asset: schema.arg({
        type: 'Hash',
      }),
      blockHeight: schema.arg({
        type: 'Int',
      }),
    },
    resolve(parent, args, ctx) {
      const { fromOrTo, asset, blockHeight } = args;
      if (fromOrTo && (asset || blockHeight)) {
        throw new GraphQLError(
          `The use of "fromOrTo" with other filtering arguments is not currently supported`,
        );
      }

      if (args.fromOrTo) {
        return ctx.transferService.filterByFromOrTo({
          pageArgs: args,
          fromOrTo: args.fromOrTo,
        })!;
      } else if (args.blockHeight) {
        return ctx.transferService.filterByBlockHeight({
          pageArgs: args,
          blockHeight: args.blockHeight,
        })!;
      } else if (args.asset) {
        return ctx.transferService.filterByAssetId({
          pageArgs: args,
          assetId: args.asset,
        })!;
      }

      return ctx.transferService.filter({
        pageArgs: args,
      });
    },
  });
});
