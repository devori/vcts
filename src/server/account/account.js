import accountDB from './database';
import uuid from 'uuid';

function searchTradingInfo(accountId) {
  return accountDB.searchTradingInfo(accountId);
}

function addVcTradingInfo(accountId, vcType, tradingInfo) {
  tradingInfo.uuid = uuid.v1();
  return accountDB.addVcTradingInfo(accountId, vcType, tradingInfo);
}

function removeVcTradingInfo(accountId, vcType, tradingId) {
  return accountDB.removeVcTradingInfo(accountId, vcType, {
    uuid: tradingId
  });
}

export default {
  searchTradingInfo, addVcTradingInfo, removeVcTradingInfo
};
