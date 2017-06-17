import request from 'request';

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
		let result = {
			tickers: {},
			timestamp: new Date().getTime()
		};
		for (let vcType in data) {
			let pair = vcType.split('_');
			result.tickers[pair[0]] = result.tickers[pair[0]] || {};
			result.tickers[pair[0]][pair[1]] = {
				low: data[vcType].highestBid,
				high: data[vcType].lowestAsk
			};
		}
		return result;
	});
}
