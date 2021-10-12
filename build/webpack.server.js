const config = require('./webpack.config');

module.exports = {
    ...config,
    entry: {
        server: './server/server.ts'
    }
}