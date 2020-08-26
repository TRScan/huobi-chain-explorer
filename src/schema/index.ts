import * as amount from './AssetAmount';
import * as asset from './Asset';
import * as balance from './Balance';
import * as extend from './extend';
import * as transfer from './Transfer';

export const types = {
  ...amount,
  ...asset,
  ...balance,
  ...transfer,
  ...extend,
};
