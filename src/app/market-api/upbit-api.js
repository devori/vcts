import request from 'request';
import crypto from 'crypto';
import _ from 'lodash';
import uuid from 'uuid';
import { sign } from 'jsonwebtoken';
import { encode } from 'querystring';
import logger from '../util/logger';
import * as wait from '../util/wait';

const API_BASE_URL = 'https://api.upbit.com';

export function getExchangeInfo() {
	return getTickers().then(tickers => {
		return new Promise((resolve) => {
			request(`${API_BASE_URL}/v1/market/all`, (err, res, body) => {
				if (err) {
					throw err;
				}
				resolve({ tickers, data: JSON.parse(body) });
			});
		});
	}).then(({ tickers, data }) => {
        return data.reduce((acc, { market }) => {
			const [base, vcType] = market.split('-');
			let rateStep = 0.01;
			const bid = tickers[base] && tickers[base][vcType] && tickers[base][vcType].bid || 0.01;
			if (bid < 10) {
				rateStep = 0.01;				
			} else if (bid < 100) {
				rateStep = 0.1;
			} else if (bid < 1000) {
				rateStep = 1;
			} else if (bid < 10000) {
				rateStep = 5;
			} else if (bid < 100000) {
				rateStep = 10;
			} else if (bid < 500000) {
				rateStep = 50;
			} else if (bid < 1000000) {
				rateStep = 100;
			} else if (bid < 2000000) {
				rateStep = 500;
			} else {
				rateStep = 1000;
			}
			acc[base] = acc[base] || {};
			acc[base][vcType] = {
				rate: {
					step: rateStep
				},
				units: {
					step: 0.00000001
				},
			};
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

export function cancel(auth, uuid) {
	return callPrivateApi(auth, 'order', 'DELETE', { uuid }, { uuid }).then(result => ({
		uuid: result.uuid,
		state: result.state,
	}));
}

export function getOrderResult(auth, uuid) {
	return callPrivateApi(auth, 'order', 'GET', { uuid }, { uuid }).then(data => {
		const result = {
			raw: data,
		};
		const [base, vcType] = data.market.split('-')
		result.trade = data.trades.reduce((acc, t) => {
			const units = Number(t.volume);
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
	})
}

export function sell(auth, base, vcType, units, rate) {
	return order(auth, base, vcType, 'ask', units, rate).then(({ raw: { uuid }}) => {
		return wait.waitPromise(uuid, 500);
	}).then(uuid => {
		try {
			cancel(auth, uuid);
		} catch (e) {}
		return wait.waitPromise(uuid, 500);
	}).then(uuid => getOrderResult(auth, uuid));
}

export function buy(auth, base, vcType, units, rate) {
	return order(auth, base, vcType, 'bid', units, rate).then(({ raw: { uuid }}) => {
		return wait.waitPromise(uuid, 500);
	}).then(uuid => {
		try {
			cancel(auth, uuid);
		} catch (e) {}
		return wait.waitPromise(uuid, 500);
	}).then(uuid => getOrderResult(auth, uuid));
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
		console.log(data	)
		return result;
	});
}

function callPrivateApi(auth, command, method, body = {}, query = '') {
	const token = getHashSha512(auth, body);
	if (query) {
		query = '?' + encode(query);
	} else {
		query = ''
	}

	const options = {
		method,
		url: `${API_BASE_URL}/v1/${command}${query}`,
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
