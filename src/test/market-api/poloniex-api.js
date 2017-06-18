import { expect, should } from 'chai';
import sinon from 'sinon';
import nock from 'nock';
import * as poloniexApi from '../../app/market-api/poloniex-api';

describe('market-api/poloniex-api.js', function () {

  describe('getTickers', () => {
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
    });
  });

  describe('getBalances', () => {
    before(() => {
      nock('https://poloniex.com')
      .post('/tradingApi', {
        command: 'returnBalances'
      })
      .reply(200, {
        USDT: '100',
        BTC: '1.123456789'
      });
    });

    it('should return refined balances when getBalances call', done => {
      let prom = poloniexApi.getBalances({
        apiKey: 'a',
        secretKey: 'b'
      });
      expect(prom).to.be.a('promise');
      prom.then(result => {
        expect(result.balances.USDT).to.equal(100);
        expect(result.balances.BTC).to.equal(1.12345678);
        expect(result.timestamp).to.be.a('number');
        expect(result.raw.USDT).to.equal('100');
        expect(result.raw.BTC).to.equal('1.123456789');
        done();
      });
      this.timeout(3000);
    });

    after(() => {
      nock.cleanAll();
    })
  });

  describe('sell', () => {
    before(() => {
      nock('https://poloniex.com')
      .post('/tradingApi', {
        command: 'sell',
        currencyPair: 'USDT_BTC',
        rate: '2600',
        amount: '1',
        immediateOrCancel: '1'
      })
      .reply(200, {
        "orderNumber": 123,
        "resultingTrades": [
          {
            "amount": "0.4",
            "date": "2017-06-18 14:31:12",
            "rate": "2500",
            "total": "1000",
            "tradeID": "1",
            "type": "sell"
          },
          {
            "amount": "0.6",
            "date": "2017-06-18 14:31:12",
            "rate": "2600",
            "total": "1560",
            "tradeID": "2",
            "type": "sell"
          }
        ]
      });
    });

    it('should return sale result when sell call', done => {
      let prom = poloniexApi.sell({
        apiKey: 'a',
        secretKey: 'b'
      }, 'USDT', 'BTC', 1, 2600);
      expect(prom).to.be.a('promise');
      prom.then(result => {
        expect(result.raw.orderNumber).to.equal(123);
        expect(result.raw.resultingTrades).to.have.lengthOf(2);
        expect(result.trades).to.have.lengthOf(2);
        expect(result.trades[0]).to.deep.include({
          units: 0.4,
          price: 2500,
          total: 0.4 * 2500 * 0.9975,
          type: 'sell'
        });
        expect(result.trades[0].timestamp).to.be.a('number');
        expect(result.trades[1]).to.deep.include({
          units: 0.6,
          price: 2600,
          total: 0.6 * 2600 * 0.9975,
          type: 'sell'
        });
        expect(result.trades[1].timestamp).to.be.a('number');
        done();
      });
      this.timeout(3000);
    });

    after(() => {
      nock.cleanAll();
    })
  });
});