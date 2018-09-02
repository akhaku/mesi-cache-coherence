const L1Cache = require('./l1Cache');
const MESIState = require('./MESIState');

/**
 * An L2 cache. Each processor has its own L2 cache, and its main job to to coordinate the
 * cores' L1 caches.
 */
class L2Cache {
  constructor(numL1Caches) {
    this.l1Caches = [];
    for (let i = 0; i < numL1Caches; i++) {
      this.l1Caches.push(new L1Cache(`L1-${i}`, this));
    }
  }

  /**
   * Return an array of all the L1 caches.
   */
  getL1Caches() {
    return this.l1Caches;
  }
}

module.exports = L2Cache;
