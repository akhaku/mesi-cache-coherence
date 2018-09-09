const MESIState = require('./MESIState');
const CacheLine = require('./cacheLine');
const utils = require('../utils');

/**
 * An L1 cache. Each core has its own L1 cache.
 * Note that this implementation currently does not evict cache lines, but it could.
 */
class L1Cache {
  constructor(name, l2Cache) {
    this.name = name;
    this.l2Cache = l2Cache;
    this.cacheLineToState = {}; // cache line (represented by numeric ID) to MESIState
    this.cacheLines = {}; // cache line ID to CacheLine object
  }

  getName() {
    return this.name;
  }

  /**
   * Write a value to an address.
   */
  write(address, value) {
    // compute cache line and figure out what state it is in
    const cacheLine = utils.computeCacheLine(address);
    const cacheLineState = this.cacheLineToState[cacheLine] || MESIState.I;
    if (cacheLineState === MESIState.S || cacheLineState === MESIState.I) {
      // request for ownership - ack returns the current value, lets us change state
      const currentValue = this.l2Cache.requestForOwnership(cacheLine, this);
      // always copy cache line - don't use same reference
      this.cacheLines[cacheLine] = new CacheLine(currentValue);
    }
    // now that we own the line, we can mutate it
    this.cacheLines[cacheLine].set(utils.computeOffset(address), value);
    this.cacheLineToState[cacheLine] = MESIState.M;
  }

  /**
   * Reads a value from an address. The value may be in this cache, in a sister cache, or
   * in no L1 cache at all.
   */
  read(address) {
    const cacheLine = utils.computeCacheLine(address);
    const cacheLineState = this.cacheLineToState[cacheLine] || MESIState.I;
    if (cacheLineState === MESIState.I) {
      const currentValue = this.l2Cache.requestForShare(cacheLine, this);
      this.cacheLineToState[cacheLine] = MESIState.S;
      // always copy cache line - don't use same reference
      this.cacheLines[cacheLine] = new CacheLine(currentValue);
    }
    // now that our own cache is up to date, we can return the value
    return this.cacheLines[cacheLine].get(utils.computeOffset(address));
  }

  /**
   * This method allows the L2 cache to get the current value and invalidate this L1
   * cache's cache line.
   */
  snoopInvalidate(cacheLine) {
    const state = this.cacheLineToState[cacheLine] || MESIState.I;
    if (state === MESIState.I) {
      return null; // may have been evicted
    }
    this.cacheLineToState[cacheLine] = MESIState.I;
    return this.cacheLines[cacheLine]; // effectively an ack, too
  }

  /**
   * This method allows the L1 cache to get the current value to share with another L1
   * cache.
   */
  snoopShare(cacheLine) {
    const cacheLineState = this.cacheLineToState[cacheLine] || MESIState.I;
    if (cacheLineState === MESIState.I) {
      return null; // may have been evicted
    }
    this.cacheLineToState[cacheLine] = MESIState.S;
    return this.cacheLines[cacheLine];
  }
}

module.exports = L1Cache;
