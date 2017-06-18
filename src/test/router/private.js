import express from 'express';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import supertest from 'supertest';
import sinon from 'sinon';
import { expect, should } from 'chai';
import * as marketApi from '../../app/market-api';
import privateRouter from '../../app/router/private';
import * as account from '../../app/account';

describe('router/private.js', function () {
  const apiKey = 'api key';
  const secretKey = 'secret key';

  let mockAccount;
  let app;
  beforeEach(() => {
    mockAccount = sinon.mock(account);

		sinon.stub(account, 'authenticate')
			.withArgs('test-api-key', sinon.match({ nonce: '123' }), 'correct').returns(true)
			.withArgs('test-api-key', sinon.match({ nonce: '123' }), 'incorrect').returns(false);

    sinon.stub(marketApi.load('poloniex'), 'getBalances').withArgs({
      apiKey: apiKey,
      secretKey: secretKey
    }).callsFake(() => {
      return Promise.resolve({
  			balances: {
          USDT: 1000,
          BTC: 1.5
        },
  			timestamp: new Date().getTime(),
  			raw: {}
  		});
    });

    sinon.stub(marketApi.load('poloniex'), 'buy').withArgs({
      apiKey: apiKey,
      secretKey: secretKey
    }).callsFake(() => {
      return Promise.resolve({
  			trades: [
          {
            units: 0.9975,
            price: 100,
            total: 100
          }
        ],
  			timestamp: new Date().getTime(),
  			raw: {}
  		});
    });

    sinon.stub(marketApi.load('poloniex'), 'sell').withArgs({
      apiKey: apiKey,
      secretKey: secretKey
    }).callsFake(() => {
      return Promise.resolve({
        trades: [
          {
            units: 1,
            price: 10000,
            total: 9975
          }
        ],
        timestamp: new Date().getTime(),
        raw: {}
      });
    });

    app = express();
    app.use(bodyParser.json());
    app.use('/', privateRouter);
  });

  it('should return balances when authentication is correct', done => {
    supertest(app)
			.get('/accounts/test-api-key/markets/poloniex/balances')
      .set('nonce', 123)
      .set('sign', 'correct')
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(200)
      .end((err, res) => {
        if (err) {
          expect.fail('', '', 'request failure');
          return;
        }
        expect(res.body.USDT).to.equal(1000);
        expect(res.body.BTC).to.equal(1.5);
        expect(res.body.raw).to.not.exist;
        done();
      });
    this.timeout(3000);
  });

  it('should return 401 status code when authentication is incorrect', () => {
    supertest(app)
      .get('/accounts/test-api-key/markets/poloniex/balances')
			.set('nonce', 123)
			.set('sign', 'incorrect')
      .expect(401)
  });

  it('should return buy result after buy info save when buy call', done => {
    mockAccount.expects('addAsset').withArgs('test-api-key', 'poloniex').once();
    mockAccount.expects('addHistory').withArgs('test-api-key', 'poloniex').once();
    supertest(app)
      .post('/accounts/test-api-key/markets/poloniex/USDT/BTC', {
        units: 1,
        price: 100
      })
      .set('nonce', 123)
      .set('sign', 'correct')
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(200)
      .end((err, res) => {
        mockAccount.verify();
        done();
      });
    this.timeout(3000);
  });

  it('should return sell result after sell info save when sell call', done => {
    mockAccount.expects('removeAsset').withArgs('test-api-key', 'poloniex').once();
    mockAccount.expects('addHistory').withArgs('test-api-key', 'poloniex').once();
    supertest(app)
      .delete('/accounts/test-api-key/markets/poloniex/USDT/BTC', {
        units: 1,
        price: 10000
      })
      .set('nonce', 123)
      .set('sign', 'correct')
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(200)
      .end((err, res) => {
        mockAccount.verify();
        done();
      });
    this.timeout(3000);
  });

  afterEach(() => {
		account.authenticate.restore();
    mockAccount.restore();
    marketApi.load('poloniex').getBalances.restore();
    marketApi.load('poloniex').buy.restore();
    marketApi.load('poloniex').sell.restore();
  });
});
