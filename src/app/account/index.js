import crypto from 'crypto';
import * as accountDao from '../database/account-dao';

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

export function register(info) {
	return accountDao.createAccount(info);
}

export function authenticate(accountId, source, dest) {
  let secretKey = accountDao.getSecretKey(accountId);
	if (!secretKey) {
    return false;
  }
  let hash = getHmacSha512(secretKey, source);
  if (hash !== dest) {
    return false;
  }
  return true;
}

export function getMarketKeys(accountId, market) {
	return accountDao.getMarketKeys(accountId, market);
}

export function searchAssets(accountId, market, base, vcType) {
	return accountDao.searchAssets(accountId, market, base, vcType);
}

export function addAsset(accountId, market, asset) {
	return accountDao.addAsset(accountId, market, asset);
}

export function addHistory(accountId, market, history) {
	return accountDao.addHistory(accountId, market, history);
}

export function removeAsset(accountId, market, base, vcType, units) {
	if (units <= 0) {
		return;
	}
	let assets = searchAssets(accountId, market, base, vcType);
	assets.sort((a1, a2) => a2.price - a1.price);
	for (let i = assets.length - 1; i >= 0; i--) {
		if (assets[i].units <= units) {
			accountDao.removeAsset(accountId, market, {
				base,
				vcType,
				uuid: assets[i].uuid
			});
			units -= assets[i].units;
		} else {
			accountDao.updateAsset(accountId, market, {
				base,
				vcType,
				units: assets[i].units - units,
				uuid: assets[i].uuid
			});
			break;
		}
	}
}

export function getHistory(accountId, market, base, vcType) {
	return accountDao.getHistory(accountId, market, base, vcType);
}
