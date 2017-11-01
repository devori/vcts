import { expect, should } from 'chai';
import nock from 'nock';
import * as poloniexApi from '../../app/market-api/poloniex-api';

describe('market-api/poloniex-api.js', function () {

  describe('getTickers', () => {
    before(() => {
      nock('https://poloniex.com')
      .get('/public?command=returnTicker')
      .reply(200, {
        USDT_BTC: {
          lowestAsk: '101',
          highestBid: '99'
        },
        BTC_TEST: {
          lowestAsk: '102',
          highestBid: '98'
        }
      });
    });

    after(() => {
      nock.cleanAll();
    });

    it('should return refined tickers when getTickers call', done => {
      let prom = poloniexApi.getTickers();
      expect(prom).to.be.a('promise');
      prom.then(result => {
        expect(result.USDT).to.exist;
        expect(result.USDT.BTC).to.exist;
        expect(result.USDT.BTC.base).to.equal('USDT');
        expect(result.USDT.BTC.vcType).to.equal('BTC');
        expect(result.USDT.BTC.bid).to.equal(99);
        expect(result.USDT.BTC.ask).to.equal(101);
        expect(result.USDT.BTC.timestamp).to.be.a('number');

        expect(result.BTC).to.exist;
        expect(result.BTC.TEST).to.exist;
        expect(result.BTC.TEST.base).to.equal('BTC');
        expect(result.BTC.TEST.vcType).to.equal('TEST');
        expect(result.BTC.TEST.bid).to.equal(98);
        expect(result.BTC.TEST.ask).to.equal(102);
        expect(result.BTC.TEST.timestamp).to.be.a('number');
        done();
      });
    });
  });

  describe('getBalances', () => {
    before(() => {
      nock('https://poloniex.com')
      .post('/tradingApi', body => {
          return body.command === 'returnBalances' && !isNaN(body.nonce)
      })
      .reply(200, {
        USDT: '100',
        BTC: '1.123456789'
      });
    });

    after(() => {
      nock.cleanAll();
    });

    it('should return refined balances when getBalances call', done => {
      let prom = poloniexApi.getBalances({
        apiKey: 'a',
        secretKey: 'b'
      }, 'BTC');
      expect(prom).to.be.a('promise');
      prom.then(result => {
        expect(result.USDT).to.equal(100);
        expect(result.BTC).to.equal(1.12345678);
        done();
      });
    });
  });

  describe('sell', () => {
    before(() => {
      nock('https://poloniex.com')
      .post('/tradingApi', body => {
        return body.command === 'sell'
          && body.currencyPair === 'USDT_BTC'
          && body.rate === '2500'
          && body.amount === '1'
          && body.immediateOrCancel === '1';
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

    after(() => {
      nock.cleanAll();
    });

    it('should return merged sale result when sell call', done => {
      let prom = poloniexApi.sell({
        apiKey: 'a',
        secretKey: 'b'
      }, 'USDT', 'BTC', 1, 2500);
      expect(prom).to.be.a('promise');
      prom.then(result => {
        expect(result.raw.orderNumber).to.equal(123);
        expect(result.raw.resultingTrades).to.have.lengthOf(2);
        expect(result.trade).to.deep.include({
          base: 'USDT',
          vcType: 'BTC',
          units: 1.00000000,
          rate: 2560.00000000
        });
        expect(result.trade.timestamp).to.be.a('number');
        done();
      });
    });
  });

  describe('buy', () => {
    before(() => {
      nock('https://poloniex.com')
      .post('/tradingApi', body => {
          return body.command === 'buy'
              && body.currencyPair === 'USDT_BTC'
              && body.rate === '2600'
              && body.amount === '1'
              && body.immediateOrCancel === '1';
      })
      .reply(200, {
        "orderNumber": 124,
        "resultingTrades": [
          {
            "amount": "0.4",
            "date": "2017-06-18 14:31:12",
            "rate": "2500",
            "total": "1000",
            "tradeID": "3",
            "type": "buy"
          },
          {
            "amount": "0.6",
            "date": "2017-06-18 14:31:12",
            "rate": "2600",
            "total": "1560",
            "tradeID": "4",
            "type": "buy"
          }
        ]
      });
    });

    after(() => {
      nock.cleanAll();
    });

    it('should return merged buy result when buy call', done => {
      let prom = poloniexApi.buy({
        apiKey: 'a',
        secretKey: 'b'
      }, 'USDT', 'BTC', 1, 2600);
      expect(prom).to.be.a('promise');
      prom.then(result => {
        expect(result.raw.orderNumber).to.equal(124);
        expect(result.raw.resultingTrades).to.have.lengthOf(2);
        expect(result.trade).to.deep.include({
          base: 'USDT',
          vcType: 'BTC',
          units: 0.99750000,
          rate: 2560.00000000
        });
        expect(result.trade.timestamp).to.be.a('number');
        done();
      });
    });
  });
});
