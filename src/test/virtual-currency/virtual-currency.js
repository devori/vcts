import { expect, should } from 'chai';

import vc from '../../app/virtual-currency/virtual-currency';

describe('virtual-currency', () => {
  it('should throw exception when value is null', () => {
    expect(() => {
      vc.add('', null);
    }).to.throw('value is empty');
  });
});
