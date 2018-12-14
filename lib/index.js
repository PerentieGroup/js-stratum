var net = require('net');
var pool = require('./pool.js');
//Gives us global access to everything we need for each hashing algorithm
require('./algoProperties.js');

exports.daemon = require('./daemon.js');
exports.varDiff = require('./varDiff.js');

exports.createPool = function (poolOptions, authorizeFn) {
    var newPool = new pool(poolOptions, authorizeFn);
    return newPool;
};
