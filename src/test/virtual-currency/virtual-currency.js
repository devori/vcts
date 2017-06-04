import { expect, should } from 'chai';
import sinon from 'sinon';

import vc from '../../app/virtual-currency/virtual-currency';
import vcDb from '../../app/virtual-currency/database';

describe('virtual-currency/virtual-currency', () => {
  let vcDbStub = sinon.stub(vcDb);
  before(() => {
    vcDbStub.add.withArgs('test', 'not null').callsFake(() => 'added');
    vcDbStub.remove.withArgs('test', 'not null').callsFake(() => 'removed');
    vcDbStub.search.withArgs('test', 'not null').callsFake(() => 'searched');
  });

  it('should throw exception when value is null', () => {
    expect(() => {
      vc.add('', null);
    }).to.throw('value is empty');
  });

  it('should call vcDB.add with origin arguments when value is not null', () => {
    expect(vc.add('test', 'not null')).to.be.equal('added');
  });

  it('should call vcDb.remove with origin arguments', () => {
    expect(vc.remove('test', 'not null')).to.be.equal('removed');
  });

  it('should call vcDb.search with origin arguments', () => {
    expect(vc.search('test', 'not null')).to.be.equal('searched');
  })
});
