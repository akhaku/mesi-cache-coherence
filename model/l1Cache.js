const MESIState = require('./MESIState');

const NUM_CACHE_LINES = 2;
/**
 * An L1 cache. Each core has its own L1 cache.
 * Note that for simplicy's sake, we assume that there are only 2 cache lines.
 */
class L1Cache {
  constructor(name, l2Cache) {
    this.name = name;
    this.l2Cache = l2Cache;
    this.cacheLineToState = {}; // cache line (integer) to MESIState
    this.addressToValue = {}; // address as a string to the value stored there
  }

  getName() {
    return this.name;
  }

  /**
   * Write a value to an address.
   */
  write(address, value) {
    // compute cache line and figure out what state it is in
    const cacheLine = computeCacheLine(address);
    const cacheLineState = this.cacheLineToState[cacheLine] || MESIState.EMPTY;
    switch (cacheLineState) {
        case MESIState.M:
        case MESIState.E:
          this.addressToValue[address] = value;
          this.cacheLineToState[cacheLine] = MESIState.M;
          break;
        case MESIState.S:
        case MESIState.EMPTY:
          // request for ownership - ack returns the current value, lets us change state
          const currentValue = this.l2Cache.requestForOwnership(address, this);
          this.cacheLineToState[cacheLine] = MESIState.M;
          this.addressToValue[address] = value;
          break;
        case MESIState.I:
          throw new Error('Invalid state, what do we do?');
    }
  }

  /**
   * Reads a value from an address. The value may be in this cache, in a sister cache, or
   * in no L1 cache at all.
   */
  read(address) {
    const cacheLine = computeCacheLine(address);
    const cacheLineState = this.cacheLineToState[cacheLine] || MESIState.EMPTY;
    switch (cacheLineState) {
      case MESIState.M:
      case MESIState.E:
      case MESIState.S:
        return this.addressToValue[address];
      case MESIState.I:
      case MESIState.EMPTY:
        const currentValue = this.l2Cache.requestForShare(address, this);
        this.cacheLineToState[cacheLine] = MESIState.S;
        this.addressToValue[address] = currentValue;
        return currentValue;
    }
  }

  /**
   * This method allows the L2 cache to get the current value and invalidate this L1
   * cache.
   */
  snoopInvalidate(address) {
    const cacheLine = computeCacheLine(address);

    // sanity checks
    if (!this.cacheLineToState[cacheLine]
        || !this.addressToValue[address]) {
      throw new Error(`Missing data at address ${address}`);
    }

    const state = cacheLineToState[cacheLine];
    switch (state) {
      case MESIState.M:
      case MESIState.E:
      case MESIState.S:
        this.cacheLineToState[computeCacheLine(address)] = MESIState.I;
        return this.addressToValue[address]; // effectively an ack, too
      default:
        throw new Error('Should not be snooping on a cache with no value');
    }
  }

  /**
   * This method allows the L1 cache to get the current value to share with another L1
   * cache.
   */
  snoopShare(address) {
    const cacheLine = computeCacheLine(address);

    // sanity checks
    if (!this.cacheLineToState[cacheLine]
        || !this.addressToValue[address]) {
      throw new Error(`Missing data at address ${address}`);
    }

    const cacheLineState = this.cacheLineToState[cacheLine];
    switch (cacheLineState) {
      case MESIState.M:
      case MESIState.E:
        this.cacheLineToState[cacheLine] = MESIState.S;
        return this.addressToValue[address];
      default:
        throw new Error('Should not be calling snoopShare unless M or E');
    }
  }
}

function computeCacheLine(address) {
  // for simplicity's sake we are doing a modulo of the the string length
  return address.length % NUM_CACHE_LINES;
}

module.exports = L1Cache;
