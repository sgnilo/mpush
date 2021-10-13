const config = require('./webpack.config');

module.exports = {
    ...config,
    entry: {
        client: './src/client/client.ts'
    }
}