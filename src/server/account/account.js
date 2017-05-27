import accountDB from './database';
import uuid from 'uuid';

function searchAssets(accountId, vcType) {
  return accountDB.searchAssets(accountId, vcType);
}

function addAsset(accountId, vcType, assetInfo) {
  assetInfo.uuid = uuid.v1();
  return accountDB.addAsset(accountId, vcType, assetInfo);
}

function removeAsset(accountId, vcType, count) {
  let vcTypeAssets = searchAssets(accountId, vcType);
  vcTypeAssets.sort((a1, a2) => {
    return a1.price - a2.price;
  });

  let removedAssetCount = 0;
  vcTypeAssets.forEach(asset => {
    if (count <= 0) {
      return;
    } else if (count >= asset.units) {
      removedAssetCount += asset.units;
      count -= asset.units;
      accountDB.removeAsset(accountId, vcType, asset.uuid);
    } else {
      removedAssetCount += count;
      asset.units -= count;
      count = 0;
      accountDB.updateAsset(accountId, vcType, asset);
    }
  });
  return removedAssetCount;
}

export default {
  searchAssets, addAsset, removeAsset
};
