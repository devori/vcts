import { expect, should } from 'chai';
import sinon from 'sinon';
import nock from 'nock';
import poloniexApi from '../../app/trade/poloniex-api';

describe('trade/poloniex-api', function () {
  before(() => {
    nock('https://poloniex.com')
      .get('/public?command=returnTicker')
      .reply(200, {
        USDT_BTC: {
          id: "1",
          last: "1",
          lowestAsk: "1",
          highestBid: "1"
        },
        BTC_TEST: {
          id: "2",
          last: "2",
          lowestAsk: "2",
          highestBid: "2"
        }
    });
  });

  it('getTickers should return fileds casted to number', function (done) {
    poloniexApi.getTickers().then(result => {
      expect(result.USDT_BTC).to.exist;
      expect(result.USDT_BTC.last).to.equal(1);
      expect(result.BTC_TEST).to.exist;
      expect(result.BTC_TEST.last).to.equal(2);
      done();
    });
    this.timeout(3000);
  });

  after(() => {
    nock.enableNetConnect();
  });
});
