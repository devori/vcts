import { expect, should } from 'chai';
import * as accountDao from '../../app/database/account-dao';

describe('database/account-dao', () => {
  const ACCOUNT_ID = 'test-user';
  const INVALID_ACCOUNT_ID = 'invalid-account-id';
  const MARKET = 'a-market';
  before(() => {

  });

  it('should return null if accountId does not exist', () => {
    let result = accountDao.searchAssets(INVALID_ACCOUNT_ID, MARKET);
    expect(result).to.be.null
  });

  it('should return assets', () => {
    let result = accountDao.searchAssets(ACCOUNT_ID, MARKET, 'USDT', 'BTC');
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
    let result = accountDao.addAsset(ACCOUNT_ID, MARKET, asset);
    expect(result.uuid).to.exist;
    expect(result).to.not.equal(asset);
    accountDao.removeAsset(ACCOUNT_ID, MARKET, {
      base: asset.base,
      vcType: asset.vcType,
      uuid: asset.uuid
    });
  });

  it('should return history after history add', () => {
    let history = {
      base: 'USDT',
      vcType: 'BTC',
      units: 1,
      price: 2500,
      total: 2500,
      type: 'sell',
      timestamp: 123
    };
    let result = accountDao.addHistory(ACCOUNT_ID, MARKET, history);
    expect(result.price).to.equal(2500);
  });

  it('should remove asset matched when removeAsset', () => {
    let addedAsset = accountDao.addAsset(ACCOUNT_ID, MARKET, {
      base: 'USDT',
      vcType: 'BTC',
      units: 1,
      price: 2500,
      timestamp: 123
    });
    let arr = accountDao.searchAssets(ACCOUNT_ID, MARKET, 'USDT', 'BTC');
    expect(arr[arr.length - 1].uuid).to.equal(addedAsset.uuid);
    let lengthBeforeRemove = arr.length;
    accountDao.removeAsset(ACCOUNT_ID, MARKET, {
      base: 'USDT',
      vcType: 'BTC',
      uuid: addedAsset.uuid
    });
    let arrAfterRemove = accountDao.searchAssets(ACCOUNT_ID, MARKET, 'USDT', 'BTC');
    expect(arrAfterRemove.length).to.equal(lengthBeforeRemove - 1);
  });
});
