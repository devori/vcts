import request from 'request';
import crypto from 'crypto';
import _ from 'lodash';
import uuid from 'uuid';
import { sign } from 'jsonwebtoken'
import logger from '../util/logger';

const API_BASE_URL = 'https://api.upbit.com';

export function getExchangeInfo() {
	return new Promise((resolve) => {
        request(`${API_BASE_URL}/v1/market/all`, (err, res, body) => {
            if (err) {
                throw err;
            }
            resolve(JSON.parse(body));
        });
	}).then(data => {
        return data.reduce((acc, { market }) => {
			const [base, vcType] = market.split('-');
			acc[base] = acc[base] || {};
			acc[base][vcType] = {};
            return acc;
        }, {});
    });
}

export function getTickers() {
	return new Promise((resolve) => {
        request(`${API_BASE_URL}/v1/market/all`, (err, res, body) => {
            if (err) {
                throw err;
            }
            resolve(JSON.parse(body));
        });
	}).then(data => {
		return data.map(({ market }) => market)
			.filter(market => market.startsWith('KRW'));
	}).then(markets => {
		return new Promise((resolve) => {
			request({
				url: `${API_BASE_URL}/v1/orderbook`,
				qs: {
					markets: markets.join(','),
				},
			}, (err, res, body) => {
				if (err) {
					throw err;
				}
				resolve(JSON.parse(body));
			});
		});
	}).then(data => {
		return data.reduce((acc, ticker) => {
			const [base, vcType] = ticker.market.split('-')
			const prices = ticker.orderbook_units[0] || {};
			acc[base] = acc[base] || {};
			acc[base][vcType] = {
				base,
				vcType,
				bid: Number(prices.bid_price),
				ask: Number(prices.ask_price),
				timestamp: ticker.timestamp
			};
			return acc;
		}, {});
	});
}

export function getBalances(auth) {
	return new Promise((resolve) => {
		const token = sign({
			access_key: auth.apiKey,
			nonce: uuid.v4(),
		}, auth.secretKey);

        request({
			url: `${API_BASE_URL}/v1/accounts`,
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}, (err, res, body) => {
            if (err) {
                throw err;
            }
            resolve(JSON.parse(body));
        });
	}).then(data => {
        return data.reduce((acc, info) => {
			acc[info.currency] = Number(info.balance) + Number(info.locked);
			return acc;
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
	logger.info(`[Order] ${side} ${base}-${vcType} : ${units}(units) ${rate}(rate)`);
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
		url: `${API_BASE_URL}/v3/${command}`,
		headers: {
			'X-MBX-APIKEY': auth.apiKey
		},
		[method === 'GET' ? 'qs' : 'form']: params,
	};

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
