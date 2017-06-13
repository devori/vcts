import { expect, should } from 'chai';
import sinon from 'sinon';
import account from '../../app/account/account';
import accountFileDB from '../../app/database/account-file-db';
import { VCTYPES } from '../../app/properties';

describe('account/account', function () {
  const ACCOUNT_ID = 'mochaTest';
  const TEST_VCTYPE = 'BTC';

  let accountDB = accountFileDB.load(ACCOUNT_ID);
  before(() => {
    sinon.spy(accountDB, 'addAsset');
    sinon.spy(accountDB, 'searchAssets');
    sinon.spy(accountDB, 'removeAsset');
  });


  it('should be called accountDB.searchAssets when account.searchAssets call', () => {
    account.searchAssets(ACCOUNT_ID, TEST_VCTYPE);
    expect(accountDB.searchAssets.calledOnce).to.be.true;
  });

  it('should be added uuid and trunc units less than 0.0001 when addAsset call', () => {
    account.addAsset(ACCOUNT_ID, TEST_VCTYPE, {
      "price": 1000000,
      "units": 1.0000123,
      "timestamp": 1496563708088
    });
    let args = accountDB.addAsset.getCall(0).args;
    expect(args[0]).to.be.equal(TEST_VCTYPE);
    expect(args[1].uuid).to.exist;
    expect(args[1].units).to.equal(1.000012);
  });

  it('should remove lower price asset first when remove call', () => {
    account.removeAsset(ACCOUNT_ID, TEST_VCTYPE, 10);
    account.addAsset(ACCOUNT_ID, TEST_VCTYPE, {
      "price": 30000,
      "units": 3,
      "timestamp": 1496563708088
    });
    account.addAsset(ACCOUNT_ID, TEST_VCTYPE, {
      "price": 40000,
      "units": 4,
      "timestamp": 1496563708088
    });

    account.removeAsset(ACCOUNT_ID, TEST_VCTYPE, 4);
    let assets = account.searchAssets(ACCOUNT_ID, TEST_VCTYPE);
    expect(assets).to.have.lengthOf(1);
    expect(assets[0].price).to.be.equal(40000);
    expect(assets[0].units).to.be.equal(3);
  });

  after(() => {
    accountDB.searchAssets.restore();
    accountDB.addAsset.restore();
    account.removeAsset(ACCOUNT_ID, TEST_VCTYPE, 10);
  });
});
