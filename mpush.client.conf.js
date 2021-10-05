const path = require('path');

module.exports = {
    receiver: '0.0.0.0:2580',
    dir: '../test1',
    rootPath: '../',
    watch: true,
    defaultRemotePath: '/Users/jiangpingxu/mpush/test',
    rules: [
        {
            rule: /5/,
            path: path.resolve(__dirname, './test/deep')
        }
    ],
}