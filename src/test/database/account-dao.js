import { expect, should } from 'chai';
import * as accountDao from '../../app/database/account-dao';

describe('database/account-dao', () => {
  const UUID = 'test-user';
  const INVALID_UUID = 'invalid-uuid';
  const MARKET = 'a-market';
  before(() => {

  });

  it('should return null if uuid does not exist', () => {
    let result = accountDao.searchAssets(INVALID_UUID, MARKET);
    expect(result).to.be.null
  });

  it('should return assets', () => {
    let result = accountDao.searchAssets(UUID, MARKET, 'USDT', 'BTC');
    expect(result).to.be.a('array');
  });

  it('should return asset included uuid after asset add', () => {
    let asset = {
      base: 'USDT',
      vcType: 'BTC',
      units: 1,
      price: 2500,
      timestamp: 123
    };
    let result = accountDao.addAsset(UUID, MARKET, asset);
    expect(result.uuid).to.exist;
    expect(result).to.not.equal(asset);
  })
});
