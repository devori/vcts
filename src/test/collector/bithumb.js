import { expect, should } from 'chai';
import sinon from 'sinon';
import nock from 'nock';
import collectorForBithumb from '../../app/collector/bithumb';
import priceFileDB from '../../app/database/price-file-db';
import { VCTYPES } from '../../app/properties';

describe('collector/bithumb', function () {
  const MARKET_NAME = 'bithumb';
  let mockPriceDB;
  before(() => {
    mockPriceDB = sinon.mock(priceFileDB.load(MARKET_NAME));
    nock('https://api.bithumb.com')
      .get('/public/ticker/ALL')
      .reply(200, {
        data: {
          BTC: {
            closing_price: 1
          }
        }
    });
  });

  it('collected data should be added to priceFileDB', function (done) {
    let expectationForAdd = mockPriceDB.expects('add').once();
    let expectationForRemove = mockPriceDB.expects('remove').once();

    collectorForBithumb.collect().then(() => {
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
