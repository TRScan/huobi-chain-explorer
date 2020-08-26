import { schema } from '@muta-extra/hermit-purple';

export const AssetAmount = schema.objectType({
  name: 'AssetAmount',
  definition(t) {
    t.field('asset', {
      type: 'Asset',
      nullable: true,
      resolve(parent, args, ctx) {
        return ctx.assetService.findByAssetId(parent.assetId);
      },
    });

    t.field('value', {
      type: 'Uint64',
      nullable: true,
    });

    t.string('amount', {
      async resolve(parent, args, ctx) {
        if (!parent.value) return '0';
        return ctx.assetService.getAmount(parent.assetId, parent.value);
      },
    });
  },
});
