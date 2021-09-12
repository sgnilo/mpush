#!/usr/bin/env node

const net = require('net');
const {computMd5} = require('../util/md5.ts');
const fs = require('fs');
const config = require('./config');

const {port} = config;

const createFile = filePath => {
    const pathList = filePath.split('/');
    pathList.reduce((path, dir) => {
        if (path) {
            if (!fs.existsSync(path)) {
                fs.mkdirSync(path);
            }
        }
        return path + '/' + dir;
    });
    fs.writeFileSync(filePath, '', {flag: 'w'});
};

const server = net.createServer();

server.on('connection', socket => {
    let chunk = '';
    let isConf = true;
    let activeFileName = '';
    let activeFileSize = 0;
    let activeFileMd5 = '';
    const parseConf = () => {

        if (/^\$.+\$$/g.test(chunk)) {
            console.log('解析出了配置', chunk);
            chunk = chunk.replace(/\$/g, '');
            const conf = JSON.parse(chunk);
            const {remotePath, size, md5} = conf;
            isConf = false;
            activeFileName = remotePath;
            activeFileSize = size;
            activeFileMd5 = md5
            chunk = '';
            createFile(remotePath);
        }
    };
    socket.on('data', res => {
        try {
            const resStr = res.toString('utf8');
            console.log(resStr.length)
            if (/\r\n/g.test(resStr)) {
                const data = resStr.toString('utf8').split(/\r\n/g);
                console.log(data.map(i => i.length));
                data.forEach(line => {
                    if (!line) {return};
                    if (isConf) {
                        chunk += line;
                        parseConf();
                    } else {
                        fs.writeFileSync(activeFileName, line, {flag: 'as'});
                        if (computMd5(activeFileName) === activeFileMd5) {
                            isConf = true;
                            socket.write(JSON.stringify({
                                fileName: activeFileName
                            }));
                        }
                    }
                });
            } else if (isConf){
                chunk += resStr;
                parseConf();
            } else if (resStr !== '\r\n') {
                fs.writeFileSync(activeFileName, res, {flag: 'as'});
            }
        } catch(err) {
            socket.write(JSON.stringify({error: err}));
        }
    });
});

server.listen(port, () => {
    console.log(`now is listening at :${port}`);
});