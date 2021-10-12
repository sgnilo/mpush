const config = require('./webpack.config');

module.exports = {
    ...config,
    entry: {
        client: './client/client.ts',
        server: './server/server.ts'
    }
}