import request from 'request';
import crypto from 'crypto';
import _ from 'lodash';

const API_BASE_URL = 'https://poloniex.com';

export function getTickers() {
	return new Promise((resolve, reject) => {
		request(`${API_BASE_URL}/public?command=returnTicker`, (err, res, body) => {
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
				bid: Number(data[vcType].highestBid),
				ask: Number(data[vcType].lowestAsk),
				timestamp: new Date().getTime()
			};
		}
		return result;
	});
}

export function getBalances(auth) {
	return callPrivateApi(auth, 'returnBalances').then(data => {
		let result = {};
		for (let k in data) {
			result[k] = _.floor(Number(data[k]), 8);
		}
		return result;
	});
}

export function sell(auth, base, vcType, units, rate) {
	return callPrivateApi(auth, 'sell', {
		currencyPair: `${base}_${vcType}`,
		rate: String(rate),
		amount: String(units),
		immediateOrCancel: '1'
	}).then(data => {
		let result = {
			raw: data
		};
		result.trade = data.resultingTrades.reduce((acc, t) => {
			let units = Number(t.amount);
			let rate = Number(t.rate);
			acc.rate = (acc.units * acc.rate + units * rate) / (acc.units + units);
			acc.rate = Number(acc.rate.toFixed(8));
			acc.units += units;
			acc.units = Number(acc.units.toFixed(8));
			return acc;
		}, {
			base,
			vcType,
			units: 0,
			rate: 0,
			timestamp: new Date().getTime()
		});
		return result;
	});
}

export function buy(auth, base, vcType, units, rate) {
	return callPrivateApi(auth, 'buy', {
		currencyPair: `${base}_${vcType}`,
		rate: String(rate),
		amount: String(units),
		immediateOrCancel: '1'
	}).then(data => {
		let result = {
			raw: data
		};
		result.trade = data.resultingTrades.reduce((acc, t) => {
			let units = Number(t.amount) * 0.9975;
			let rate = Number(t.rate);
			acc.rate = (acc.units * acc.rate + units * rate) / (acc.units + units);
			acc.rate = Number(acc.rate.toFixed(8));
			acc.units += units;
			acc.units = Number(acc.units.toFixed(8));
			return acc;
		}, {
			base,
			vcType,
			units: 0,
			rate: 0,
			timestamp: new Date().getTime()
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
			url: `${API_BASE_URL}/tradingApi`,
			headers: headers,
			form: params
		}, (err, res, body) => {
			if (err) {
				reject(err);
				return;
			}
			resolve(JSON.parse(body));
		})
	}).then(result => {
		if (result.error) {
			throw result.error;
		}
		return result;
	}).catch(err => {
		console.error(err);
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
