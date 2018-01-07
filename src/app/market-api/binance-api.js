import request from 'request';
import crypto from 'crypto';
import _ from 'lodash';

const API_BASE_URL = 'https://api.binance.com/api/v3';

const HEADER = {
	CONTENT_TYPE: 'application/x-www-form-urlencoded',
	API_KEY_HEADER: 'X-MBX-APIKEY'
};

const SIGN = {
	ALGORITHM: 'sha256',
	SIGNATURE_NAME: 'signature',
	TIMESTAMP_NAME: 'timestamp'
}

export function getTickers() {
	return new Promise((resolve, reject) => {
		request(`${API_BASE_URL}/ticker/bookTicker`, (err, res, body) => {
			if (err) {
				throw err;
			}
			resolve(JSON.parse(body));
		});
	}).then(data => {
		return data.reduce((acc, ticker) => {
			const symbol = ticker.symbol;
			const base = symbol.substr(symbol.length - 3, 3);
			const vcType = symbol.substr(0, symbol.length - 3);
			acc[base] = acc[base] || {};
			acc[base][vcType] = {
				base: 'BTC',
				vcType,
				bid: Number(ticker.bidPrice),
				ask: Number(ticker.askPrice),
				timestamp: new Date().getTime()
			}
			return acc;
		}, {});
	})
}

export function getBalances(auth) {
	return callPrivateApi(auth, 'account', 'GET', {}).then(data => {
		return data.balances.reduce((accum, row) => {
			accum[row.asset] = _.floor(Number(row.free) + Number(row.locked), 8);
			return accum;
		}, {});
	});
}

export function sell(auth, base, vcType, units, rate) {
	return order(auth, base, vcType, 'SELL', units, rate);
}

export function buy(auth, base, vcType, units, rate) {
	return order(auth, base, vcType, 'BUY', units, rate);
}

export function order(auth, base, vcType, side, units, rate) {
	return callPrivateApi(auth, 'order', 'POST', {
		symbol: `${vcType}${base}`,
		side,
		type: 'LIMIT',
		timeInForce: 'IOC',
		quantity: units,
		price: rate,
		newOrderRespType: 'FULL'
	}).then(data => {
		if (data.fills.length === 0) {
			throw 'there is no fills';
		}
		const result = {
			raw: data
		};
		result.trade = data.fills.reduce((acc, t) => {
			const units = Number(t.qty);
			const rate = Number(t.price);
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

function callPrivateApi(auth, command, method, params = {}) {
	params.timestamp = String(new Date().getTime());
	params.signature = getHmacSha256(auth.secretKey, params);

	const options = {
		method,
		url: `${API_BASE_URL}/${command}`,
		headers: { 'X-MBX-APIKEY': auth.apiKey },
		[method === 'GET' ? 'qs' : 'form']: params,
	}

	return new Promise((resolve, reject) => {
		request(options, (err, res, body) => {
			if (err) {
				reject(err);
				return;
			}
			resolve(JSON.parse(body));
		})
	}).then(result => {
		if (result.code < 0) {
			throw result.msg;
		}
		return result;
	});
}

function getHmacSha256(key, params) {
	const uriencodedParams = Object.keys(params).map(key => {
		return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
	}).join('&');

	return crypto.createHmac('sha256', key).update(uriencodedParams).digest('hex');
}
