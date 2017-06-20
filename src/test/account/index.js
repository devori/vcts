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
	const MARKET = 'a-market';

	before(() => {
		sinon.stub(accountDao, 'addAsset').returnsArg(2);
	});

  it('should return true with correct args', () => {
    let hash = getHmacSha512('test secret key', { nonce: 123 });
    let result = account.authenticate('test-api-key', {
      nonce: 123
    }, hash);
    expect(result).to.equal(true);
  });

  it('should return false with incorrect args', () => {
    let hash = getHmacSha512('incorrect secret key', { nonce: 123 });
    let result = account.authenticate('test-api-key', {
      nonce: 123
    }, hash);
    expect(result).to.equal(false);
  });

	it('should return result of dao when addAsset call', () => {
		let result = accountDao.addAsset(ACCOUNT_ID, MARKET, {
			base: 'USDT',
			vcType: 'BTC',
			units: 1.23
		});
		expect(result.base).to.equal('USDT');
		expect(result.vcType).to.equal('BTC');
		expect(result.units).to.equal(1.23);
	});

	it('should return result of dao when addHistory call', () => {
		let result = accountDao.addAsset(ACCOUNT_ID, MARKET, {
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

	after(() => {
		accountDao.addAsset.restore();
	});
});
