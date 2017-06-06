import { expect, should } from 'chai';
import sinon from 'sinon';
import collectorForBithumb from '../../app/collector/poloniex';
import priceFileDB from '../../app/database/price-file-db';

describe('collector/poloniex', function () {
  const MARKET_NAME = 'poloniex';
  let mockPriceDB;
  before(() => {
    mockPriceDB = sinon.mock(priceFileDB.load(MARKET_NAME));
  });

  it('collected data should be added to priceFileDB', function (done) {
    let expectationForAdd = mockPriceDB.expects('add').atLeast(30);
    let expectationForRemove = mockPriceDB.expects('remove').atLeast(30);

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
