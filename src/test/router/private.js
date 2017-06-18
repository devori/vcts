import express from 'express';
import crypto from 'crypto';
import supertest from 'supertest';
import sinon from 'sinon';
import { expect, should } from 'chai';
import marketApi from '../../app/market-api';
import privateRouter from '../../app/router/private';
import * as account from '../../app/account';

describe('router/private.js', function () {
  const secretKey = 'secret key';

  let app;
  before(() => {
		sinon.stub(account, 'authenticate')
			.withArgs('api-key-for-test', sinon.match({ nonce: '123' }), 'correct').returns(true)
			.withArgs('api-key-for-test', sinon.match({ nonce: '123' }), 'incorrect').returns(false);
      
    sinon.stub(marketApi.load('poloniex'), 'getBalances').callsFake(() => {
      return Promise.resolve({
  			balances: {
          USDT: 1000,
          BTC: 1.5
        },
  			timestamp: new Date().getTime(),
  			raw: {}
  		});
    });

    app = express();
    app.use('/', privateRouter);
  });

  it('should return balances when authentication is correct', done => {
    supertest(app)
			.get('/accounts/api-key-for-test/markets/poloniex/balances')
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
      .get('/accounts/api-key-for-test/markets/poloniex/balances')
			.set('nonce', 123)
			.set('sign', 'incorrect')
      .expect(401)
  });

  after(() => {
		account.authenticate.restore();
    marketApi.load('poloniex').getBalances.restore();
  });
});
