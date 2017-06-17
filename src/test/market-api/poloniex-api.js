import { expect, should } from 'chai';
import sinon from 'sinon';
import nock from 'nock';
import * as poloniexApi from '../../app/market-api/poloniex-api';

describe('market-api/poloniex-api.js', function () {

  before(() => {
    nock('https://poloniex.com')
      .get('/public?command=returnTicker')
      .reply(200, {
        USDT_BTC: {
          lowestAsk: 101,
          highestBid: 99
        },
        BTC_TEST: {
          lowestAsk: 102,
          highestBid: 98
        }
    });
  });

  it('should return refined tickers when getTickers call', done => {
    let prom = poloniexApi.getTickers();
    expect(prom).to.be.a('promise');
    prom.then(result => {
      expect(result.tickers.USDT).to.exist;
      expect(result.tickers.USDT.BTC).to.exist;
      expect(result.tickers.USDT.BTC.low).to.equal(99);
      expect(result.tickers.USDT.BTC.high).to.equal(101);

      expect(result.tickers.BTC).to.exist;
      expect(result.tickers.BTC.TEST).to.exist;
      expect(result.tickers.BTC.TEST.low).to.equal(98);
      expect(result.tickers.BTC.TEST.high).to.equal(102);
      expect(result.timestamp).to.be.a('number');
      done();
    });
    this.timeout(3000);
  });

  after(() => {
    nock.cleanAll();
  })
});
