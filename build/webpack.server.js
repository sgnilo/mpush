const config = require('./webpack.config');

module.exports = {
    ...config,
    entry: {
        server: './src/server/server.ts'
    }
}