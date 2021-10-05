const path = require('path');

module.exports = {
    receiver: '0.0.0.0:2580',
    dir: '../test1',
    watch: true,
    remotePath: '/Users/jiangpingxu/mpush/test',
    rules: [
        {
            rule: /5/,
            path: path.resolve(__dirname, './test/deep')
        }
    ],
}