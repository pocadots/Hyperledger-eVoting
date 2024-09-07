'use strict';

// const voteInit = require('./lib/voteInit');

// module.exports.voteInit = voteInit;
// module.exports.contracts = [voteInit];
const voteChain = require('./lib/VoteChain');

module.exports.VoteChain = voteChain;
module.exports.contracts = [voteChain];
