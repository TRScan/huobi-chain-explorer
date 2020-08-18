import { schema } from '@muta-extra/hermit-purple';

export const ExtendTransaction = schema.extendType({
  type: 'Transaction',
  definition: (t) => {
    t.field('fee', { type: 'Uint64' });
    t.field('timestamp', { type: 'Timestamp' });
  },
});
