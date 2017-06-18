import { expect, should } from 'chai';
import sinon from 'sinon';
import crypto from 'crypto';
import * as account from '../../app/account';

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
});
