import bithumb from './bithumb';

let monitorSites = {
  bithumb
}

export default function (name = 'bithumb') {
  return monitorSites[name];
}
