const requireFunc = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require

const path = require('path');
const process = require('process');

let customConfig = {};

process.argv.forEach((item, index) => {
    if (index) {
        const arg = item.split('=');
        if (arg[0] === '--config') {
            customConfig = requireFunc(path.join(process.env.PWD, arg[1])) || {};
        }
    }
});

module.exports = {
    chunkSize: 5000,
    timeout: 5,
    watch: false,
    ...customConfig
};