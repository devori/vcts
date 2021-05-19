import request from 'request';
import crypto from 'crypto';
import _ from 'lodash';
import logger from '../util/logger';
import * as wait from '../util/wait';

const PROTOCOL = 'https://'
const API_BASE_URL = 'api-cloud.huobi.co.kr';

export function getExchangeInfo() {
	const steps = [1, 0.1, 0.01, 0.001, 0.0001, 0.00001, 0.000001, 0.0000001, 0.00000001, 0.000000001, 0.0000000001];

	return new Promise((resolve) => {
        request(`${PROTOCOL}${API_BASE_URL}/v1/common/symbols`, (err, res, body) => {
            if (err) {
                throw err;
            }
            resolve(JSON.parse(body));
        });
	}).then(({ data }) => {
			return data.reduce((acc, info) => {
				const quote = info['quote-currency'].toUpperCase();
				const base = info['base-currency'].toUpperCase();
					acc[quote] = acc[quote] || {};
					acc[quote][base] = {
							rate: {
									step: steps[info['price-precision']],
							},
							units: {
									step: steps[info['amount-precision']],
							}
					};
					return acc;
			}, {});
    });
}

export function getTickers() {
	return new Promise((resolve) => {
		request(`${PROTOCOL}${API_BASE_URL}/market/tickers`, (err, res, body) => {
			if (err) {
				throw err;
			}
			resolve(JSON.parse(body));
		});
	}).then(({ data }) => {
		return data.reduce((acc, ticker) => {
			const symbol = ticker.symbol.toUpperCase();
			const base = symbol.endsWith('USDT') ? 'USDT' : symbol.substr(symbol.length - 3, 3);
			const vcType = symbol.endsWith('USDT') ? symbol.substr(0, symbol.length - 4) : symbol.substr(0, symbol.length - 3);
			acc[base] = acc[base] || {};
			acc[base][vcType] = {
				base,
				vcType,
				bid: Number(ticker.bid),
				ask: Number(ticker.ask),
				timestamp: new Date().getTime()
			};
			return acc;
		}, {});
	});
}

export function getBalances(auth) {
	return callPrivateApi(auth, `account/accounts/${auth.accountId}/balance`, 'GET', {
	}).then(({ data }) => {
		return data.list.reduce((accum, row) => {
			accum[row.currency.toUpperCase()] = accum[row.currency.toUpperCase()] || 0;
			accum[row.currency.toUpperCase()] += _.floor(Number(row.balance), 8);
			return accum;
		}, {});
	});
}

export function getOrderResult(auth, orderId, vcType) {
	return callPrivateApi(auth, `order/orders/${orderId}`, 'GET', { 'order-id': orderId })
		.then(({ data }) => {
			const result = {
				raw: data,
			};
			console.log(data);
			const base = data.symbol.substr(vcType.length).toUpperCase();
			const units = Number(Number(data['field-amount']).toFixed(8));
			let rate = Number(Number(data['price']).toFixed(8));
			if (units > 0) {
				rate = Number(((Number(data['field-cash-amount']).toFixed(8)) / units).toFixed(8));
			}
			result.trade = {
				base,
				vcType,
				units: units - (data.type.startsWith('buy') ? Number(Number(data['field-fees']).toFixed(8)) : 0),
				rate,
				timestamp: new Date().getTime()
			};
			return result;
		});
}

export function sell(auth, base, vcType, units, rate) {
	return order(auth, base, vcType, 'sell', units, rate);
}

export function buy(auth, base, vcType, units, rate) {
	return order(auth, base, vcType, 'buy', units, rate);
}

export function order(auth, base, vcType, side, units, rate) {
	logger.info(`[Order] ${side} ${base}-${vcType} : ${units}(units) ${rate}(rate)`);
	return callPrivateApi(auth, 'order/orders/place', 'POST', {
		'account-id': auth.accountId,
		symbol: `${vcType}${base}`.toLowerCase(),
		type: `${side}-ioc`.toLowerCase(),
		amount: units,
		price: rate,
	}).then(({ data }) => {
		return wait.waitPromise(data, 500);
	}).then((orderId) => getOrderResult(auth, orderId, vcType));
}

function callPrivateApi(auth, command, method, params = {}) {
	const authParams = {
		AccessKeyId: auth.apiKey,
		SignatureMethod: 'HmacSHA256',
		SignatureVersion: '2',
		Timestamp: new Date().toISOString().substr(0, 19),
	}
	const options = { method, url: `${PROTOCOL}${API_BASE_URL}/v1/${command}` };
	if (method === 'GET') {
		options.qs = _.assign(authParams, params, {
			Signature: getHmacSha256(auth.secretKey, command, method, {authParams, params}),
		});
	} else if (method === 'POST') {
		options.qs = _.assign(authParams, {
			Signature: getHmacSha256(auth.secretKey, command, method, { authParams }),
		});
		options.headers = { 'Content-Type': 'application/json' };
		options.body = JSON.stringify(params);
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

function getHmacSha256(key, command, method, { authParams, params }) {
	const uriEncodedParams = [authParams, params || {}].map(
		obj => Object.keys(obj)
			.sort((k1, k2) => k1 < k2 ? -1 : 1)
			.map(key => {
				return encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]);
			})
			.join('&')
	).filter(v => v).join('&');
	const body = `${method}\n${API_BASE_URL}\n/v1/${command}\n${uriEncodedParams}`;

	return crypto.createHmac('sha256', key).update(body).digest('base64');
}
