import request from 'request';

function collect(currency, callback) {
  request(`https://api.bithumb.com/public/ticker/${currency}`, (err, res, body) => {
    callback(JSON.parse(body).data);
  });
}

export default {
  collect
}
