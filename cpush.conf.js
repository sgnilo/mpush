const path = require('path');

module.exports = {
    receiver: '0.0.0.0:2580',
    dir: '../example/test1',
    watch: true,
    remotePath: '/Users/jiangpingxu/cpush/example/test',
    rules: [
        {
            test: /5/,
            path: path.resolve(__dirname, './example/test/deep')
        }
    ],
}