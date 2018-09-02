/**
 * An L1 cache. Each core has its own L1 cache.
 */
class L1Cache {
  constructor(name, l2cache) {
    this.name = name;
    this.l2cache = l2cache;
    this.addressToState = {}; // address as a string to state
    this.addressToValue = {};
  }

  getName() {
    return this.name;
  }
}

module.exports = L1Cache;
