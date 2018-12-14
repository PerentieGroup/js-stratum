var ev = require('equihashverify');

var algos = module.exports = global.algos = {
    verushash: {
        multiplier: 1,
        diff: parseInt('0x0007ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
        hashReserved: '0000000000000000000000000000000000000000000000000000000000000000',
        hash: function () {
            return function () {
                return true;
            }
        }
    },
    'equihash': {
        multiplier: 1,
        diff: parseInt('0x0007ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
        hash: function () {
            return function () {
                return ev.verify.apply(this, arguments);
            }
        }
    }
};

for (var algo in algos) {
    if (!algos[algo].multiplier)
        algos[algo].multiplier = 1;
}
