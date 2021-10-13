const path = require('path');
const {RawSource}  = require('webpack-sources');

class InsertBinCommentPlugin {
    apply(compiler) {
        compiler.hooks.emit.tapAsync('insertBinCommentPlugin', (compilation, callback) => {
            compilation.chunks.forEach(chunk => {
                const file = chunk.files[0];
                const content = compilation.assets[file].source();
                compilation.assets[file] = new RawSource(`#!/usr/bin/env node\n${content}`);
            });
            callback();
        });
    }
};

module.exports = {
    target: 'node',
    mode: process.env.NODE_ENV || 'production',
    output: {
        path: path.resolve(__dirname, '../dist'),
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader'
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    plugins: [
        new InsertBinCommentPlugin()
    ]
}