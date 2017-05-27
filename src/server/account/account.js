import accountDB from './database';
import uuid from 'uuid';

function searchAssets(accountId) {
  return accountDB.searchAssets(accountId);
}

function addAsset(accountId, vcType, assetInfo) {
  assetInfo.uuid = uuid.v1();
  return accountDB.addAsset(accountId, vcType, assetInfo);
}

function removeAsset(accountId, vcType, assetId) {
  return accountDB.removeAsset(accountId, vcType, {
    uuid: assetId
  });
}

export default {
  searchAssets, addAsset, removeAsset
};
