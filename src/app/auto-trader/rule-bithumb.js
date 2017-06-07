function judgeForPurchase(vcType, priceArr, asset, availableKrw) {
  if (priceArr.length === 0) {
    return {
      price: 0,
      units: 0
    };
  }

  availableKrw = availableKrw > 400000 ? 400000 : availableKrw;
  let lastPrice = priceArr[priceArr.length - 1].price;
  let minPriceAsset = 1000000000;
  asset.forEach(a => {
    if (a.price < minPriceAsset) {
      minPriceAsset = a.price;
    }
  });

  let result = 0;
  if (lastPrice < minPriceAsset * 0.93) {
    result = availableKrw / lastPrice;
  }
  return {
    price: lastPrice,
    units: result * 0.9
  };
}

function judgeForSale(vcType, priceArr, asset) {
  if (priceArr.length === 0) {
    return {
      price: 0,
      units: 0
    };
  }

  let lastInfo = priceArr[priceArr.length - 1];
  let thresold = lastInfo.price * 0.93;
  let result = 0;

  let totalUnits = 0;
  asset.forEach(a => {
    totalUnits += a.units;
    if (a.price <= thresold) {
      result += a.units;
    }
  });

  if (asset.length === 1 && result === totalUnits) {
    result /= 2;
  }

  return {
    units: result
  };
}

export default {
  judgeForSale, judgeForPurchase
}
