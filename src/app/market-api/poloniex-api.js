import request from 'request';
import crypto from 'crypto';
import _ from 'lodash';

const POLONIEX_API_BASE_URL = 'https://poloniex.com';

export function getTickers() {
	return new Promise((resolve, reject) => {
		request(`${POLONIEX_API_BASE_URL}/public?command=returnTicker`, (err, res, body) => {
			if (err) {
				throw err;
			}
			resolve(JSON.parse(body));
		});
	}).then(data => {
		let result = {};
		for (let vcType in data) {
			let pair = vcType.split('_');
			result[pair[0]] = result[pair[0]] || {};
			result[pair[0]][pair[1]] = {
				base: pair[0],
				vcType: pair[1],
				low: Number(data[vcType].highestBid),
				high: Number(data[vcType].lowestAsk),
				timestamp: new Date().getTime()
			};
		}
		return result;
	});
}

export function getBalances(auth) {
	return callPrivateApi(auth, 'returnBalances').then(data => {
		let result = {
			balances: {},
			timestamp: new Date().getTime(),
			raw: data
		};
		for (let k in data) {
			result.balances[k] = _.floor(Number(data[k]), 8);
		}
		return result;
	});
}

export function sell(auth, base, vcType, units, price) {
	return callPrivateApi(auth, 'sell', {
		currencyPair: `${base}_${vcType}`,
		rate: String(price),
		amount: String(units),
		immediateOrCancel: '1'
	}).then(data => {
		let result = {
			raw: data,
			trades: []
		};
		data.resultingTrades.forEach(t => {
			result.trades.push({
				base,
				vcType,
				units: Number(t.amount),
				price: Number(t.rate),
				total: Number(t.amount) * Number(t.rate) * 0.9975,
				type: 'sell',
				timestamp: new Date().getTime()
			});
		});
		return result;
	});
}

export function buy(auth, base, vcType, units, price) {
	return callPrivateApi(auth, 'buy', {
		currencyPair: `${base}_${vcType}`,
		rate: String(price),
		amount: String(units),
		immediateOrCancel: '1'
	}).then(data => {
		let result = {
			raw: data,
			trades: []
		};
		data.resultingTrades.forEach(t => {
			result.trades.push({
				base,
				vcType,
				units: Number(t.amount) * 0.9975,
				price: Number(t.rate),
				total: Number(t.amount) * Number(t.rate),
				type: 'buy',
				timestamp: new Date().getTime()
			})
		});
		return result;
	});
}

function callPrivateApi(auth, command, params = {}) {
	params.command = command;
	params.nonce = String(new Date().getTime());

	let headers = {
		Key: auth.apiKey,
		Sign: getHmacSha512(auth.secretKey, params)
	};
	return new Promise((resolve, reject) => {
		request({
			method: 'POST',
			url: `${POLONIEX_API_BASE_URL}/tradingApi`,
			headers: headers,
			form: params
		}, (err, res, body) => {
			if (err) {
				reject();
				throw err;
			}
			resolve(JSON.parse(body));
		})
	}).then(result => {
		if (result.error) {
			throw result.error;
		}
		return result;
	});
}

function getHmacSha512(key, params) {
	let paramStr = "";
	for (let k in params) {
		paramStr += encodeURIComponent(k) + '=' + encodeURIComponent(params[k]) + "&";
	}
	if (paramStr.charAt(paramStr.length - 1) === '&') {
		paramStr = paramStr.substr(0, paramStr.length - 1);
	}

	return crypto.createHmac('sha512', key).update(paramStr).digest('hex');
}
