import { expect, should } from 'chai';
import * as accountDao from '../../app/database/account-dao';

describe('database/account-dao', () => {
  before(() => {

  });

  it('should return null if uuid does not exist', () => {
    let result = accountDao.searchAssets('invalid-uuid', 'a-market');
    expect(result).to.be.null
  });

  it('should return assets', () => {
    let result = accountDao.searchAssets('test-user', 'poloniex', 'USDT', 'BTC');
    expect(result).to.lengthOf(0);
  });
});
