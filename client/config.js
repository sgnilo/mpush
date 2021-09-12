const path = require('path');
const process = require('process');

let workPath = '';
let customConfig = {};

process.argv.forEach((item, index) => {
    if (index) {
        const arg = item.split('=');
        if (arg[0] === '--config') {
            customConfig = require(path.resolve(__dirname, '..', arg[1])) || {};
        }
        if (index === 1) {
            workPath = item.replace(/\/[^\/]+$/g, '');
        }
    }
});

module.exports = {
    chunkSize: 5000,
    timeout: 5,
    watch: false,
    ...customConfig
};