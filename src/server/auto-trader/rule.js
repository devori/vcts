function judge(currency, history, krwBalance, purchaseList) {
  if (currency === 'LTC') {
    if (history.closing_price < 35000) {
      let buyUnits = Math.floor(100 * (krwBalance / 35100)) / 100;
      if (buyUnits > 0.1) {
        return {
          buyUnits
        };
      }
    } else if (history.closing_price > 37000) {
      if (purchaseList.length > 0) {
        return {
          sellId: purchaseList[0].id
        };
      }
    }
  }

  return {};
}

export default {
  judge
}
