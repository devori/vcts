import fs from 'fs';
import { expect, should } from 'chai';
import lowdb from 'lowdb';
import * as accountDao from '../../app/database/account-dao';

describe('database/account-dao', () => {
  const USERNAME = 'test-user';
  const INVALID_USERNAME = 'invalid-account-id';
  const MARKET = 'poloniex';
  const API_KEY = 'api-key';
  const SECRET_KEY = 'secret-key';

  before(() => {
    if (fs.existsSync(`./data/accounts/${USERNAME}/${MARKET}/key.json`)) {
      fs.unlinkSync(`./data/accounts/${USERNAME}/${MARKET}/key.json`);
    }
    if (fs.existsSync(`./data/accounts/${USERNAME}/${MARKET}`)) {
      fs.rmdirSync(`./data/accounts/${USERNAME}/${MARKET}`);
    }
    if (fs.existsSync(`./data/accounts/${USERNAME}`)) {
      fs.rmdirSync(`./data/accounts/${USERNAME}`);
    }
    fs.mkdirSync(`./data/accounts/${USERNAME}`);
    fs.mkdirSync(`./data/accounts/${USERNAME}/${MARKET}`);
    let db = lowdb(`./data/accounts/${USERNAME}/${MARKET}/key.json`);
    db.defaults({
      apiKey: API_KEY,
      secretKey: SECRET_KEY,
      username: USERNAME
    }).write();
  });

  after(() => {
    fs.unlinkSync(`./data/accounts/${USERNAME}/${MARKET}/key.json`);
    fs.unlinkSync(`./data/accounts/${USERNAME}/${MARKET}/assets.json`);
    fs.unlinkSync(`./data/accounts/${USERNAME}/${MARKET}/history.json`);
    fs.rmdirSync(`./data/accounts/${USERNAME}/poloniex`);
    fs.rmdirSync(`./data/accounts/${USERNAME}`);
  });

  describe('getMarketKeys', () => {
    it('should return market keys if accountId and market are valid', () => {
      let result = accountDao.getMarketKeys(USERNAME, MARKET);
      expect(result.apiKey).to.exist;
      expect(result.secretKey).to.exist;
    });
  });

  it('should return null if accountId does not exist', () => {
    let result = accountDao.searchAssets(INVALID_USERNAME, MARKET);
    expect(result).to.be.null
  });

  it('should return assets', () => {
    let result = accountDao.searchAssets(USERNAME, MARKET, 'USDT', 'BTC');
    expect(result).to.be.a('array');
  });

  it('should return asset included uuid after asset add', () => {
    let asset = {
      base: 'USDT',
      vcType: 'BTC',
      units: 1,
      rate: 2500,
      timestamp: 123
    };
    let result = accountDao.addAsset(USERNAME, MARKET, asset);
    expect(result.uuid).to.exist;
    expect(result).to.not.equal(asset);
    accountDao.removeAsset(USERNAME, MARKET, {
      base: asset.base,
      vcType: asset.vcType,
      uuid: asset.uuid
    });
  });

  it('should return asset', () => {
    let asset = {
      base: 'USDT',
      vcType: 'BTC',
      units: 1,
      rate: 2500,
      timestamp: 123
    };
    let result = accountDao.addAsset(USERNAME, MARKET, asset);
    let assetById = accountDao.searchAssetById(USERNAME, MARKET, result.base, result.vcType, result.uuid);
    expect(assetById.uuid).to.equal(result.uuid);
    accountDao.removeAsset(USERNAME, MARKET, {
      base: result.base,
      vcType: result.vcType,
      uuid: result.uuid
    });
  })

  it('should return history after history add', () => {
    let history = {
      base: 'USDT',
      vcType: 'BTC',
      units: 1,
      rate: 2500,
      total: 2500,
      type: 'sell',
      timestamp: 123
    };
    let result = accountDao.addHistory(USERNAME, MARKET, history);
    expect(result.rate).to.equal(2500);
  });

  it('should remove asset matched when removeAsset', () => {
    let addedAsset = accountDao.addAsset(USERNAME, MARKET, {
      base: 'USDT',
      vcType: 'BTC',
      units: 1,
      rate: 2500,
      timestamp: 123
    });
    let arr = accountDao.searchAssets(USERNAME, MARKET, 'USDT', 'BTC');
    expect(arr[arr.length - 1].uuid).to.equal(addedAsset.uuid);
    let lengthBeforeRemove = arr.length;
    accountDao.removeAsset(USERNAME, MARKET, {
      base: addedAsset.base,
      vcType: addedAsset.vcType,
      uuid: addedAsset.uuid
    });
    let arrAfterRemove = accountDao.searchAssets(USERNAME, MARKET, 'USDT', 'BTC');
    expect(arrAfterRemove.length).to.equal(lengthBeforeRemove - 1);
  });

  it('should update asset matched when updateAsset', () => {
    let addedAsset = accountDao.addAsset(USERNAME, MARKET, {
      base: 'USDT',
      vcType: 'BTC',
      units: 1,
      rate: 2500,
      timestamp: 123
    });
    accountDao.updateAsset(USERNAME, MARKET, {
      base: addedAsset.base,
      vcType: addedAsset.vcType,
      units: 0.4,
      uuid: addedAsset.uuid
    });
    let arr = accountDao.searchAssets(USERNAME, MARKET, 'USDT', 'BTC');
    let updatedAsset = arr[arr.length - 1];
    expect(updatedAsset.units).to.equal(0.4);
  });

  describe('createAccount', () => {
    const NEW_TEST_USERNAME = 'new-test-username';
    before(() => {
      if (fs.existsSync(`./data/accounts/${NEW_TEST_USERNAME}/${MARKET}`)) {
        fs.rmdirSync(`./data/accounts/${NEW_TEST_USERNAME}/${MARKET}`);
      }
      if (fs.existsSync(`./data/accounts/${NEW_TEST_USERNAME}`)) {
        fs.rmdirSync(`./data/accounts/${NEW_TEST_USERNAME}`);
      }
    });
    after(() => {
      fs.rmdirSync(`./data/accounts/${NEW_TEST_USERNAME}/${MARKET}`);
      fs.rmdirSync(`./data/accounts/${NEW_TEST_USERNAME}`);
    })
    it('should return user info when it called', () => {
      let result = accountDao.createAccount({ username: NEW_TEST_USERNAME });
      expect(result.username).to.equal(NEW_TEST_USERNAME)
    });
  })

  it('should return history when getHistory call', () => {
    accountDao.addHistory(USERNAME, MARKET, {
      base: 'USDT',
      vcType: 'BTC',
      units: 1,
      rate: 2500,
      total: 2500,
      type: 'sell',
      timestamp: 123
    });
    let result = accountDao.getHistory(USERNAME, MARKET, null, null);
    expect(result.USDT).to.exist;
    expect(result.USDT.BTC).to.exist;
  });

  describe('existUser', () => {
    it('should return when user exists', () => {
      expect(accountDao.existUser(USERNAME)).to.be.true;
    })
  })
});
