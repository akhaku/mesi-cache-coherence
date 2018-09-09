const CACHE_LINE_SIZE = require('../utils').CACHE_LINE_SIZE;
const utils = require('../utils');
const WORD_SIZE = 0x8; // 1 byte (8 bit) word size

class CacheLine {
  constructor(existing) {
    // data is an array of bytes
    if (existing) {
      this.data = existing.data.slice(0, existing.data.length); // copy existing data
    } else {
      // load an array of default values from main memory
      this.data = [];
      for (var i = 0; i < CACHE_LINE_SIZE / WORD_SIZE; i++) {
        this.data.push(utils.DEFAULT_VALUE);
      }
    }
  }

  /**
   * Return data from a specific offset.
   */
  get(offset) {
    validateOffset(offset);
    return this.data[offset / WORD_SIZE];
  }

  /**
   * Set data at a specific offset.
   */
  set(offset, value) {
    validateOffset(offset);
    if (typeof value !== 'number' || value < 0 || value >= (1 << WORD_SIZE)) {
      throw new Error(`Currently only support for writing positive numbers under ${1 << WORD_SIZE}`);
    }
    this.data[offset / WORD_SIZE] = value;
  }
}

function validateOffset(offset) {
  if (offset > CACHE_LINE_SIZE - WORD_SIZE - 1) {
    throw new Error(`Cannot read offset ${offset} past the length of the cache line`);
  }
  if (offset % WORD_SIZE !== 0) {
    throw new Error(
      `Misaligned reads not allowed - read address must be multiple of ${WORD_SIZE}`)
  }
}

module.exports = CacheLine;
