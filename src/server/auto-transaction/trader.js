function sell(...ids) {
  console.log('sell:', ids);
}

function buy(price, count) {
  console.log('buy:', price, count);
}

export default {
  sell, buy
}
