import request from 'request';
import lowdb from 'lowdb';
import crypto from 'crypto';
import logger from '../util/logger';

const apiData = lowdb('../api-poloniex.json');
const API_KEY = apiData.get('connect').value();
const SECRET_KEY = apiData.get('secret').value();
const POLONIEX_API_URL = ' https://poloniex.com/tradingApi';

export default {
	sell, buy, info
}

function sell(accountId, currency, rate, units) {
	return callApi('sell', {
			currencyPair: `BTC_${currency}`,
			rate: rate,
			amount: units,
			immediateOrCancel: 1
	}).then(result => {
		logger.info(`[${Date()}] Poloniex Sale: ${currency} - ${rate} - ${units}`);
		logger.info(result);
		return result;
	});
}

function buy(accountId, currency, rate, units) {
	return callApi('buy', {
		currencyPair: `BTC_${currency}`,
		rate: rate,
		amount: units,
		immediateOrCancel: 1
	}).then(result => {
		logger.info(`[${Date()}] Poloniex Purchase: ${currency} - ${rate} - ${units}`);
		logger.info(result);
		return result;
	});
}

function info(accountId) {
	return callApi('returnBalances');
}

function callApi(command, params = {}) {
	params.command = command;
	params.nonce = String(new Date().getTime());

	let headers = {
		Key: API_KEY,
		Sign: getHmacSha512(params)
	};

	return new Promise((resolve, reject) => {
		request({
			method: 'POST',
			url: POLONIEX_API_URL,
			headers: headers,
			form: params
		}, (err, res, body) => {
			if (err) {
				reject(err);
				return;
			}
			let result = JSON.parse(body);
			resolve(result);
		});
	});
}

function getHmacSha512(params) {
	let paramStr = "";
	for (let k in params) {
		paramStr += encodeURIComponent(k) + '=' + encodeURIComponent(params[k]) + "&";
	}
	if (paramStr.charAt(paramStr.length - 1) === '&') {
		paramStr = paramStr.substr(0, paramStr.length - 1);
	}

	return crypto.createHmac('sha512', SECRET_KEY).update(paramStr).digest('hex');
}
