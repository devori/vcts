import express from 'express';
import supertest from 'supertest';
import sinon from 'sinon';
import { expect, should } from 'chai';
import marketApi from '../../app/market-api';
import publicRouter from '../../app/router/public';

describe('router/public.js', function () {
  let app;
  before(() => {
    sinon.stub(marketApi.load('poloniex'), 'getTickers').callsFake(() => {
      return Promise.resolve({
        USDT: {
          BTC: {
            base: 'USDT',
            vcType: 'BTC',
            low: 2400,
            high: 2500,
            timestamp: 123
          }
        }
      });
    });

    app = express();
    app.use('/', publicRouter);
  });

  it('should return market price info when /markets/poloniex/tickers url is called', done => {
    supertest(app)
      .get('/markets/poloniex/tickers')
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(200)
      .end((err, res) => {
        if (err) {
          console.log(err);
          expect.fail('', '', 'request failure');
          return;
        }
        expect(res.body.USDT.BTC.base).to.equal('USDT');
        expect(res.body.USDT.BTC.vcType).to.equal('BTC');
        expect(res.body.USDT.BTC.low).to.equal(2400);
        expect(res.body.USDT.BTC.high).to.equal(2500);
        expect(res.body.USDT.BTC.timestamp).to.equal(123);
        done();
      });
    this.timeout(3000);
  });

  it('should return USDT market price info when /markets/poloniex/tickers/USDT url is called', done => {
    supertest(app)
      .get('/markets/poloniex/tickers/USDT')
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(200)
      .end((err, res) => {
        if (err) {
          console.log(err);
          expect.fail('', '', 'request failure');
          return;
        }
        expect(res.body.BTC.base).to.equal('USDT');
        expect(res.body.BTC.vcType).to.equal('BTC');
        expect(res.body.BTC.low).to.equal(2400);
        expect(res.body.BTC.high).to.equal(2500);
        expect(res.body.BTC.timestamp).to.equal(123);
        done();
      });
    this.timeout(3000);
  });

  it('should return BTC market price info when /markets/poloniex/tickers/USDT/BTC url is called', done => {
    supertest(app)
      .get('/markets/poloniex/tickers/USDT/BTC')
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(200)
      .end((err, res) => {
        if (err) {
          console.log(err);
          expect.fail('', '', 'request failure');
          return;
        }
        expect(res.body.base).to.equal('USDT');
        expect(res.body.vcType).to.equal('BTC');
        expect(res.body.low).to.equal(2400);
        expect(res.body.high).to.equal(2500);
        expect(res.body.timestamp).to.be.a('number');
        done();
      });
    this.timeout(3000);
  });

  after(() => {
    marketApi.load('poloniex').getTickers.restore();
  });
});
