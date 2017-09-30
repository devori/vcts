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
  const TEST_USER = 'test-user';
  const NON_EXIST_USER = 'non-exist-user';
  const MARKET = 'poloniex';
  const ACCOUNT_API_KEY = 'test-user';
  const POLONIEX_API_KEY = 'poloniex-api-key';
  const POLONIEX_SECRET_API = 'poloniex-secret-key';

  let mockAccount;
  let app;

  before(() => {
    app = express();
    app.use(bodyParser.json());
    app.use('/', privateRouter);
  });

  describe('GET /users/:user/markets/:market/assets/:base?/:vcType?', () => {
    before(() => {
      sinon.stub(account, 'searchAssets').withArgs(TEST_USER, MARKET, sinon.match.any, sinon.match.any).returns({
        "USDT": {
          "BTC": [
            {
              "base": "USDT",
              "vcType": "BTC",
              "units": 0.4,
              "rate": 2500,
              "timestamp": 123,
              "uuid": "265dac7d-1aaa-46b0-9f46-6dac2f45f44f"
            }
          ]
        }
      });
    });
    after(() => {
      account.searchAssets.restore();
    });
    it('should return assets when the user exists', done => {
      supertest(app)
  			.get(`/users/${TEST_USER}/markets/${MARKET}/assets`)
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200)
        .end((err, res) => {
          if (err) {
            expect.fail('', '', err);
            return;
          }
          expect(res.body.USDT).to.exist;
          expect(res.body.USDT.BTC.length).to.equal(1);
          expect(res.body.USDT.BTC[0].base).to.equal('USDT');
          done();
        });
      this.timeout(3000);
    });
  });

  describe('POST /users/:user/markets/:market/assets/:base?/:vcType?', () => {
    let mockAccount;
    before(() => {
      mockAccount = sinon.mock(account);
      sinon.stub(marketApi.load(MARKET), 'buy').returns(
        Promise.resolve({
    			trades: [
            {
              units: 0.9975,
              rate: 100,
              total: 100
            }
          ],
    			timestamp: new Date().getTime(),
    			raw: {}
  		}));
    });
    after(() => {
      marketApi.load(MARKET).buy.restore();
      mockAccount.restore();
    });
    it('should return buy result with 201 after buy info save when url called', done => {
      mockAccount.expects('addAsset').withArgs(TEST_USER, MARKET).once();
      mockAccount.expects('addHistory').withArgs(TEST_USER, MARKET).once();
      supertest(app)
        .post(`/users/${TEST_USER}/markets/${MARKET}/assets/USDT/BTC`)
        .send({
          units: 1,
          rate: 100
        })
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(201)
        .end((err, res) => {
          if (err) {
            expect.fail('', '', err);
            return;
          }
          mockAccount.verify();
          done();
        });
      this.timeout(3000);
    });
  });

  describe('DELETE /users/:user/markets/:market/assets/:base?/:vcType?', () => {
    let mockAccount;
    before(() => {
      mockAccount = sinon.mock(account);
      sinon.stub(marketApi.load(MARKET), 'sell').returns(
        Promise.resolve({
          trades: [
            {
              units: 1,
              rate: 10000,
              total: 9975
            }
          ],
          timestamp: new Date().getTime(),
          raw: {}
      }));
    });
    after(() => {
      marketApi.load(MARKET).sell.restore();
      mockAccount.restore();
    });
    it('should return sell result after sell info save when sell call', done => {
      mockAccount.expects('removeAsset').withArgs(TEST_USER, MARKET).once();
      mockAccount.expects('addHistory').withArgs(TEST_USER, MARKET).once();
      supertest(app)
        .delete(`/users/${TEST_USER}/markets/${MARKET}/assets/USDT/BTC`)
        .send({
          units: 1,
          rate: 10000
        })
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200)
        .end((err, res) => {
          if (err) {
            expect.fail('', '', err);
            return;
          }
          mockAccount.verify();
          done();
        });
      this.timeout(3000);
    });
  });

  describe('GET /users/:user/markets/:market/histories/:base?/:vcType?', () => {
    before(() => {
      sinon.stub(account, 'getHistory').withArgs(ACCOUNT_API_KEY, MARKET, sinon.match.any, sinon.match.any).returns({
        "USDT": {
          "BTC": [
            {
              "base": "USDT",
              "vcType": "BTC",
              "units": 1,
              "rate": 2500,
              "total": 2500,
              "type": "sell",
              "timestamp": 123
            }
          ]
        }
      });
    });
    after(() => {
      account.getHistory.restore();
    });
    it('should return history matched condition when histories call using get method', done => {
      supertest(app)
        .get(`/users/${TEST_USER}/markets/${MARKET}/histories/USDT/BTC`)
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200)
        .end((err, res) => {
          if (err) {
            expect.fail('', '', err);
            return;
          }
          expect(res.body.USDT).to.exist;
          expect(res.body.USDT.BTC).to.exist;
          expect(res.body.USDT.BTC.length).to.equal(1);
          expect(res.body.USDT.BTC[0].base).to.equal('USDT');
          done();
        });
      this.timeout(3000);
    });
  });
});
