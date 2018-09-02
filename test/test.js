const chai = require('chai');
const L2Cache = require('../model/l2Cache');
const MEMORY_ADDRESS = '0xabc';

describe('MESI cache-coherence', function() {
  let l1Cache0, l1Cache1;

  beforeEach(function() {
    const l2Cache = new L2Cache(2);
    l1Cache0 = l2Cache.getL1Caches()[0];
    l1Cache1 = l2Cache.getL1Caches()[1];
  })

  it('is able to read a value from cache2 after writing in cache1', function() {
    l1Cache0.write(MEMORY_ADDRESS, 'a');
    chai.expect(l1Cache1.read(MEMORY_ADDRESS)).to.equal('a');
  });

  it('is able to detect stale values and read the most current one', function() {
    l1Cache0.write(MEMORY_ADDRESS, 'a');
    l1Cache1.write(MEMORY_ADDRESS, 'b');
    chai.expect(l1Cache0.read(MEMORY_ADDRESS)).to.equal('b');
    chai.expect(l1Cache1.read(MEMORY_ADDRESS)).to.equal('b');
  });

  it('is able to load from main memory', function() {
    chai.expect(l1Cache0.read(MEMORY_ADDRESS)).to.equal(L2Cache.MAIN_MEMORY_CONTENTS);
  });

  it('is able to share values loaded from main memory', function() {
    const previousMainMemoryItem = L2Cache.MAIN_MEMORY_CONTENTS;
    L2Cache.MAIN_MEMORY_CONTENTS = L2Cache.MAIN_MEMORY_CONTENTS + 'y';
    chai.expect(l1Cache0.read(MEMORY_ADDRESS)).to.equal(previousMainMemoryItem + 'y');
    L2Cache.MAIN_MEMORY_CONTENTS = previousMainMemoryItem;
    chai.expect(l1Cache1.read(MEMORY_ADDRESS)).to.equal(previousMainMemoryItem + 'y');
  });
});
