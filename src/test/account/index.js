import { expect, should } from 'chai';
import sinon from 'sinon';
import crypto from 'crypto';
import * as account from '../../app/account';
import * as accountDao from '../../app/database/account-dao';

function getHmacSha512(secretKey, data) {
	let dataStr = "";
	for (let k in data) {
		dataStr += encodeURIComponent(k) + '=' + encodeURIComponent(data[k]) + "&";
	}
	if (dataStr.charAt(dataStr.length - 1) === '&') {
		dataStr = dataStr.substr(0, dataStr.length - 1);
	}
	return crypto.createHmac('sha512', secretKey).update(dataStr).digest('hex');
}

describe('account/index', function () {
	const ACCOUNT_ID = 'test-user';
	const MARKET = 'poloniex';
	const API_KEY = 'api-key';
	const SECRET_KEY = 'secret-key';

	let mockAccountDao;
	before(() => {
		mockAccountDao = sinon.mock(accountDao);

		sinon.stub(accountDao, 'createAccount').returns({
			apiKey: API_KEY,
			secretKey: SECRET_KEY
		});
		sinon.stub(accountDao, 'addAsset').returnsArg(2);
		sinon.stub(accountDao, 'addHistory').returnsArg(2);
		sinon.stub(accountDao, 'searchAssets').returns([
			{
				base: 'USDT',
				vcType: 'BTC',
				units: 2,
				price: 2500,
				uuid: 'units-2-2500'
			},
			{
				base: 'USDT',
				vcType: 'BTC',
				units: 1,
				price: 2400,
				uuid: 'units-1-2400'
			}
		]);
	});

  it('should return true with correct args', () => {
    let hash = getHmacSha512('secret key', { nonce: 123 });
    let result = account.authenticate('test-user', {
      nonce: 123
    }, hash);
    expect(result).to.equal(true);
  });

  it('should return false with incorrect args', () => {
    let hash = getHmacSha512('incorrect secret key', { nonce: 123 });
    let result = account.authenticate('test-user', {
      nonce: 123
    }, hash);
    expect(result).to.equal(false);
  });

	it('should return result of dao when addAsset call', () => {
		let result = account.addAsset(ACCOUNT_ID, MARKET, {
			base: 'USDT',
			vcType: 'BTC',
			units: 1.23,
			price: 2500
		});
		expect(result.base).to.equal('USDT');
		expect(result.vcType).to.equal('BTC');
		expect(result.units).to.equal(1.23);
	});

	it('should return result of dao when addHistory call', () => {
		let result = account.addHistory(ACCOUNT_ID, MARKET, {
      base: 'USDT',
      vcType: 'BTC',
      units: 1.23,
      price: 2500,
      total: 2500,
      type: 'sell',
      timestamp: 123
    });
		expect(result.base).to.equal('USDT');
		expect(result.vcType).to.equal('BTC');
		expect(result.units).to.equal(1.23);
		expect(result.type).to.equal('sell');
	});

	it('should remove assets in order of low price', () => {
		mockAccountDao.expects('removeAsset').withArgs(ACCOUNT_ID, MARKET, {
			base: 'USDT',
			vcType: 'BTC',
			uuid: 'units-1-2400'
		});
		mockAccountDao.expects('updateAsset').withArgs(ACCOUNT_ID, MARKET, {
			base: 'USDT',
			vcType: 'BTC',
			units: 0.5,
			uuid: 'units-2-2500'
		});
		account.removeAsset(ACCOUNT_ID, MARKET, 'USDT', 'BTC', 2.5);
		mockAccountDao.verify();
	});

	it('should return api key info when register call', () => {
		let result = account.register({});
		expect(result.apiKey).to.equal(API_KEY);
		expect(result.secretKey).to.equal(SECRET_KEY);
	});

	after(() => {
		accountDao.createAccount.restore();
		accountDao.addAsset.restore();
		accountDao.addHistory.restore();
		accountDao.searchAssets.restore();
		mockAccountDao.restore();
	});
});
