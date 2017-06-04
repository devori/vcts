import { expect, should } from 'chai';
import accountFileDB from '../../app/database/account-file-db';


describe('database/accountFileDB', () => {
  const TARGET_CURRENCY = 'BTC';
  const ACCOUNT_ID = 'mochaTest';
  let assetInfo = {
    uuid: 'test-01',
    units: 2,
    price: 100,
    total: 200,
    date: '2017-6-4 00:00:00'
  };
  let accountDBForTest;

  before(() => {
    accountDBForTest = accountFileDB.load(ACCOUNT_ID);
    accountDBForTest.removeAsset(TARGET_CURRENCY, assetInfo.uuid);
  })

  it('should return same instance when accountId is same', () => {
    expect(accountFileDB.load(ACCOUNT_ID)).to.be.equal(accountDBForTest);
  });

  it('should return added info when addAsset call', () => {
    let result = accountDBForTest.addAsset(TARGET_CURRENCY, assetInfo);
    expect(result.units).to.be.equal(2);
    expect(result.price).to.be.equal(100);
    expect(result.total).to.be.equal(200);
    expect(result.date).to.exist;
  });

  it('should return assets all when searchAssets call', () => {
    let result = accountDBForTest.searchAssets(TARGET_CURRENCY);
    expect(result).to.have.lengthOf(1);
    expect(result[0].units).to.be.equal(2);
    expect(result[0].price).to.be.equal(100);
    expect(result[0].total).to.be.equal(200);
  });

  it('should return updated info when updateAsset call', () => {
    let updatedInfo = {
      uuid: 'test-01',
      units: 3,
      price: 100,
      total: 300,
      date: '2017-6-4 00:00:00'
    }
    let result = accountDBForTest.updateAsset(TARGET_CURRENCY, updatedInfo);
    expect(result.units).to.be.equal(3);
    expect(result.price).to.be.equal(100);
    expect(result.total).to.be.equal(300);
    expect(result.date).to.exist;
  });

  it('should return removed info when remove call', () => {
    let result = accountDBForTest.removeAsset(TARGET_CURRENCY, assetInfo.uuid);
    expect(result.units).to.be.equal(3);
    expect(result.price).to.be.equal(100);
    expect(result.total).to.be.equal(300);
  });
});
