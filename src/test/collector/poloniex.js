import { expect, should } from 'chai';
import sinon from 'sinon';
import collectorForPoloniex from '../../app/collector/poloniex';
import priceFileDB from '../../app/database/price-file-db';
import nock from 'nock';

describe('collector/poloniex', function () {
  const MARKET_NAME = 'poloniex';
  let mockPriceDB;
  let marketApiNock;
  before(() => {
    mockPriceDB = sinon.mock(priceFileDB.load(MARKET_NAME));
    nock('https://poloniex.com')
      .get('/public?command=returnTicker')
      .reply(200, {
        USDT_BTC: {},
        BTC_TEST: {}
    });
  });

  it('collected data should be added to priceFileDB', function (done) {
    let expectationForAdd = mockPriceDB.expects('add').twice();
    let expectationForRemove = mockPriceDB.expects('remove').twice();

    collectorForPoloniex.collect().then(() => {
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
    nock.cleanAll();
  });
});
