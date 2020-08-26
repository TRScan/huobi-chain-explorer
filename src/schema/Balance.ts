import { schema } from '@muta-extra/hermit-purple';
import { pageArgs } from './common';

export const Balance = schema.objectType({
  name: 'Balance',
  definition(t) {
    t.field('balance', {
      deprecation: 'Please replace with `assetAmount`',
      type: 'Uint64',
      description: 'Uint64 balance',
      resolve(parent, args, ctx) {
        return ctx.assetService.getBalance(parent.assetId, parent.address);
      },
    });

    t.field('address', {
      type: 'Address',
    });

    t.field('asset', {
      type: 'Asset',
      async resolve(parent, args, ctx) {
        return (await ctx.assetService.findByAssetId(parent.assetId))!;
      },
    });

    t.string('amount', {
      deprecation: 'Please replace with `assetAmount`',
      async resolve(parent, args, ctx) {
        const balance = await ctx.assetService.getBalance(
          parent.assetId,
          parent.address,
        );
        return ctx.assetService.getAmount(parent.assetId, balance);
      },
    });

    t.field('assetAmount', {
      type: 'AssetAmount',
      async resolve(parent, args, ctx) {
        const balance = await ctx.assetService.getBalance(
          parent.assetId,
          parent.address,
        );
        return { assetId: parent.assetId, value: balance };
      },
    });
  },
});

export const balancePagination = schema.queryField((t) => {
  t.list.field('balances', {
    type: 'Balance',
    args: {
      ...pageArgs,
      // assetId: arg({ type: 'Hash' }),
      address: schema.arg({ type: 'Address', required: true }),
    },
    async resolve(parent, args, ctx) {
      const address = args.address;
      if (!address) return [];
      return await ctx.balanceService.filterByAddress({
        pageArgs: args,
        address: args.address,
      });
    },
  });
});
