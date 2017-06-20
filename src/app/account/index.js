import crypto from 'crypto';
import apiKeyInfo from '../../../data/accounts/info';
import accountDao from '../database/account-dao';

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

export function authenticate(apiKey, source, dest) {
  let info = apiKeyInfo[apiKey];
  if (!info) {
    return false;
  }
  let hash = getHmacSha512(apiKeyInfo[apiKey].secretKey, source);
  if (hash !== dest) {
    return false;
  }
  return true;
}

export function getMarketKeys(apiKey, market) {
	return apiKeyInfo[apiKey].marketKeys[market];
}

export function addAsset(accountId, market, asset) {
	return accountDao.addAsset(accountId, market, asset);
}

export function addHistory(accountId, market, history) {
	return accountDao.addHistory(accountId, market, history);
}

export function removeAsset(accountId, market, base, vcType, units) {
	accountDao.searchAssets(accountId, market);
}
