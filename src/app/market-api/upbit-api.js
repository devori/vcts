import request from 'request';
import crypto from 'crypto';
import _ from 'lodash';
import uuid from 'uuid';
import { sign } from 'jsonwebtoken';
import { encode } from 'querystring';
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
	return order(auth, base, vcType, 'ask', units, rate);
}

export function buy(auth, base, vcType, units, rate) {
	return order(auth, base, vcType, 'BUY', units, rate);
}

export function order(auth, base, vcType, side, units, rate) {
	logger.info(`[Order] ${side} ${base}-${vcType} : ${units}(units) ${rate}(rate)`);
	return callPrivateApi(auth, 'orders', 'POST', {
		market: `${base}-${vcType}`,
		side,
		volume: String(units),
		price: String(rate),
		ord_type: 'limit',
	}).then(data => {
		const result = {
			raw: data
		};
		result.trade = {
			base,
			vcType,
			units: Number(data.executed_volume),
			rate: Number(data.avg_price),
			timestamp: new Date().getTime(),
		};
		return result;
	});
}

function callPrivateApi(auth, command, method, body = {}) {
	const token = getHashSha512(auth, body);

	const options = {
		method,
		url: `${API_BASE_URL}/v1/${command}`,
		headers: {
			Authorization: `Bearer ${token}`,
		},
		json: body,
	};

	return new Promise((resolve, reject) => {
		request(options, (err, res, body) => {
			if (err) {
				reject(err);
				return;
			}
			resolve(body);
		})
	});
}


function getHashSha512(auth, body) {
	const hash = crypto.createHash('sha512');
	const queryHash = hash.update(encode(body), 'utf-8').digest('hex');
	
	return sign({
		access_key: auth.apiKey,
		nonce: uuid.v4(),
		query_hash: queryHash,
		query_hash_alg: 'SHA512',
	}, auth.secretKey);
}
