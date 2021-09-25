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
    let isConfigPart = true;
    let activeFile = null;

    socket.on('data', res => {
        try {
            const resStr = res.toString('utf8');
            if (isConfigPart) {
                chunk += resStr;
                if (/^\$.+\$$/g.test(chunk)) {
                    console.log('解析出了配置', chunk);
                    const conf = JSON.parse(chunk.replace(/\$/g, ''));
                    const {remotePath, size, md5, taskId, localFileName} = conf;
                    activeFile = conf;
                    createFile(remotePath);
                    isConfigPart = false;
                    chunk = '';
                    socket.write(JSON.stringify({
                        fileName: remotePath,
                        taskId,
                        localFileName
                    }));
                }
            } else {
                let buffer = res;
                /config\-push/g.test(activeFile.taskId) && (activeFile.taskId = activeFile.taskId.replace('config-push', 'content-push'));
                if (/(\r\n)$/g.test(resStr)) {
                    const newStr = resStr.replace(/(\r\n)$/g, '');
                    buffer = Buffer.alloc(newStr.length, newStr);
                    setTimeout(() => {
                        if (computMd5(activeFile.remotePath) === activeFile.md5) {
                            isConfigPart = true;
                            socket.write(JSON.stringify({
                                fileName: activeFile.remotePath,
                                taskId: activeFile.taskId,
                                localFileName: activeFile.localFileName,
                                isSingleFileFinish: true
                            }));
                        }
                    }, 0);
                }
                fs.writeFileSync(activeFile.remotePath, buffer, {flag: 'as'});        
            }
        } catch(err) {
            throw new Error(err);
            
            //socket.write(JSON.stringify({error: err}));
        }
    });
});

server.listen(port, () => {
    console.log(`now is listening at :${port}`);
});