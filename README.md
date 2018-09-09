# Cache coherence

A simple implementation of the MESI cache coherence algorithm, written in Javascript. Inspired by [https://software.rajivprab.com/2018/04/29/myths-programmers-believe-about-cpu-caches/]. Also see [Wikipedia's](https://en.wikipedia.org/wiki/MESI_protocol) entry on the MESI protocol.

If I've made a mistake with the protocol implementation, please let me know.

The default cache line size is 64 bytes. Currently only reading and writing single 1 byte words is supported. Misaligned reads are not supported.

See test/test.js for some examples.
