/*
SOURCE: https://github.com/patriksimek/vm2

This is a slightly modified version of vm2. 

All credit for developing this module goes to https://github.com/patriksimek and other contributors to vm2
*/


if (parseInt(process.versions.node.split('.')[0]) < 6) throw new Error('vm2 requires Node.js version 6 or newer.');

module.exports = require('./main');
