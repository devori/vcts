import accountFileDB from '../database/account-file-db'
import uuid from 'uuid';

function addHistory(accountId, vcType, assetInfo) {
  let accountDB = accountFileDB.load(accountId);
  return accountDB.addHistory(vcType, assetInfo);
}

function searchAssets(accountId, vcType) {
  let accountDB = accountFileDB.load(accountId);
  return accountDB.searchAssets(vcType);
}

function addAsset(accountId, vcType, assetInfo) {
  let accountDB = accountFileDB.load(accountId);
  assetInfo.uuid = uuid.v1();
  assetInfo.units = Math.trunc(assetInfo.units * 10000) / 10000;
  return accountDB.addAsset(vcType, assetInfo);
}

function removeAsset(accountId, vcType, count) {
  let accountDB = accountFileDB.load(accountId);
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
      accountDB.removeAsset(vcType, asset.uuid);
    } else {
      removedAssetCount += count;
      asset.units -= count;
      count = 0;
      asset.units = Math.trunc(asset.units * 10000) / 10000;
      if (asset.units > 0) {
        accountDB.updateAsset(vcType, asset);
      } else {
        accountDB.removeAsset(vcType, asset.uuid);
      }
    }
  });
  return removedAssetCount;
}

export default {
  searchAssets, addAsset, removeAsset, addHistory
};
