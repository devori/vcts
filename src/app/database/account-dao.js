import lowdb from 'lowdb';
import uuid from 'uuid';

function findDao(uuid, market) {
  try {
    return lowdb(`./data/accounts/${uuid}/${market}/assets.json`);
  } catch (err) {
    return null;
  };
}

export function searchAssets(uuid, market, base, vcType) {
  let dao = findDao(uuid, market);
  if (!dao) {
    return null;
  };
  if (base) {
    dao = dao.get(base);
  }
  if (vcType) {
    dao = dao.get(vcType);
  }
  return dao.cloneDeep().value();
}
