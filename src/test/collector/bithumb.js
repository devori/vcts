import { expect, should } from 'chai';
import sinon from 'sinon';
import collectorForBithumb from '../../app/collector/bithumb';
import priceFileDB from '../../app/database/priceFileDB';
import { VCTYPES } from '../../app/properties';

describe('collector/bithumb', function () {
  const MARKET_NAME = 'bithumb';
  let mockPriceDB;
  before(() => {
    mockPriceDB = sinon.mock(priceFileDB.load(MARKET_NAME));
  });

  it('collected data should be added to priceFileDB', function (done) {
    let expectationForAdd = mockPriceDB.expects('add').atLeast(6);
    let expectationForRemove = mockPriceDB.expects('remove').atLeast(6);

    collectorForBithumb.collect().then(data => {
      expectationForAdd.verify();
      expectationForRemove.verify();
      done();
    }).catch(reason => {
      expect.fail('', '', 'request failure');
    });
    this.timeout(3000);
  });

  after(() => {
    mockPriceDB.restore();
  });
});
