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
  const ACCOUNT_API_KEY = 'test-user';
  const ACCOUNT_VALID_SIGN = 'account-valid-sign';
  const ACCOUNT_INVALID_SIGN = 'account-invalid-sign';
  const POLONIEX_API_KEY = 'poloniex-api-key';
  const POLONIEX_SECRET_API = 'poloniex-secret-key';
  const MARKET = 'poloniex';

  let mockAccount;
  let app;
  beforeEach(() => {
    mockAccount = sinon.mock(account);

		sinon.stub(account, 'authenticate')
			.withArgs(ACCOUNT_API_KEY, sinon.match.any, ACCOUNT_VALID_SIGN).returns(true)
			.withArgs(ACCOUNT_API_KEY, sinon.match.any, ACCOUNT_INVALID_SIGN).returns(false);

    sinon.stub(account, 'getHistory').withArgs(ACCOUNT_API_KEY, MARKET, sinon.match.any, sinon.match.any).returns({
      "USDT": {
        "BTC": [
          {
            "base": "USDT",
            "vcType": "BTC",
            "units": 1,
            "price": 2500,
            "total": 2500,
            "type": "sell",
            "timestamp": 123
          }
        ]
      }
    });

    sinon.stub(account, 'searchAssets').withArgs(ACCOUNT_API_KEY, MARKET, sinon.match.any, sinon.match.any).returns({
      "USDT": {
        "BTC": [
          {
            "base": "USDT",
            "vcType": "BTC",
            "units": 0.4,
            "price": 2500,
            "timestamp": 123,
            "uuid": "265dac7d-1aaa-46b0-9f46-6dac2f45f44f"
          }
        ]
      }
    });

    sinon.stub(marketApi.load('poloniex'), 'buy').withArgs({
      apiKey: POLONIEX_API_KEY,
      secretKey: POLONIEX_SECRET_API
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
      apiKey: POLONIEX_API_KEY,
      secretKey: POLONIEX_SECRET_API
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

  it('should return assets when authentication is correct', done => {
    supertest(app)
			.get('/markets/poloniex/assets')
      .set('api-key', ACCOUNT_API_KEY)
      .set('sign', ACCOUNT_VALID_SIGN)
      .set('nonce', new Date().getTime())
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(200)
      .end((err, res) => {
        if (err) {
          expect.fail('', '', 'request failure');
          return;
        }
        expect(res.body.USDT).to.exist;
        expect(res.body.USDT.BTC.length).to.equal(1);
        expect(res.body.USDT.BTC[0].base).to.equal('USDT');
        done();
      });
    this.timeout(3000);
  });

  it('should return 401 status code when authentication is incorrect', () => {
    supertest(app)
      .get('/')
      .set('api-key', ACCOUNT_API_KEY)
      .set('sign', ACCOUNT_INVALID_SIGN)
      .set('nonce', new Date().getTime())
      .expect(401)
  });

  it('should return 401 status code when nonce is less than current timestamp - 3000', () => {
    supertest(app)
      .get('/')
      .set('api-key', ACCOUNT_API_KEY)
      .set('sign', ACCOUNT_INVALID_SIGN)
      .set('nonce', 123)
      .expect(401)
  });

  it('should return buy result after buy info save when buy call', done => {
    mockAccount.expects('addAsset').withArgs('test-user', 'poloniex').once();
    mockAccount.expects('addHistory').withArgs('test-user', 'poloniex').once();
    supertest(app)
      .post('/markets/poloniex/assets/USDT/BTC')
      .send({
        units: 1,
        price: 100
      })
      .set('api-key', ACCOUNT_API_KEY)
      .set('sign', ACCOUNT_VALID_SIGN)
      .set('nonce', new Date().getTime())
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(200)
      .end((err, res) => {
        mockAccount.verify();
        done();
      });
    this.timeout(3000);
  });

  it('should return sell result after sell info save when sell call', done => {
    mockAccount.expects('removeAsset').withArgs('test-user', 'poloniex').once();
    mockAccount.expects('addHistory').withArgs('test-user', 'poloniex').once();
    supertest(app)
      .delete('/markets/poloniex/assets/USDT/BTC')
      .send({
        units: 1,
        price: 10000
      })
      .set('api-key', ACCOUNT_API_KEY)
      .set('sign', ACCOUNT_VALID_SIGN)
      .set('nonce', new Date().getTime())
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(200)
      .end((err, res) => {
        mockAccount.verify();
        done();
      });
    this.timeout(3000);
  });

  it('should return history matched condition when histories call using get method', done => {
    supertest(app)
      .get('/markets/poloniex/histories/USDT/BTC')
      .set('api-key', ACCOUNT_API_KEY)
      .set('sign', ACCOUNT_VALID_SIGN)
      .set('nonce', new Date().getTime())
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(200)
      .end((err, res) => {
        expect(res.body.USDT).to.exist;
        expect(res.body.USDT.BTC).to.exist;
        expect(res.body.USDT.BTC.length).to.equal(1);
        expect(res.body.USDT.BTC[0].base).to.equal('USDT');
        done();
      });
    this.timeout(3000);
  });

  afterEach(() => {
		account.authenticate.restore();
    account.getHistory.restore();
    account.searchAssets.restore();
    mockAccount.restore();
    marketApi.load('poloniex').buy.restore();
    marketApi.load('poloniex').sell.restore();
  });
});
