const {request} = require('./request.ts');
const event = require('../util/event.ts');
const {computMd5} = require('../util/md5.ts');
const fs = require('fs');
const config = require('./config');
const path = require('path');

const {chunkSize, timeout} = config;

const syncFileContent = (filePath, fileSize, context) => {
    let times = Math.floor(fileSize / chunkSize);
    const lastChunk = fileSize % chunkSize;
    let current = 0;
    const fd = fs.openSync(filePath);
    while (times >= 0) {
        const thisTimeSize = times === 0 ? lastChunk : chunkSize;
        let content = Buffer.alloc(thisTimeSize);
        fs.readSync(fd, content, 0, thisTimeSize, current)
        current += thisTimeSize;
        context.write(content);
        times--;
    }console.log(current);
    context.write(Buffer.alloc(2, '\r\n', 'utf8'));
    fs.closeSync(fd);
};


const push = (fileList, callBack) => {

    let resultList = [];

    const update = newList => {
        const notFinishedList = fileList.filter(file => !resultList.includes(file));
        const newTasks = notFinishedList.filter(file => !newList.includes(file));
        fileList = [...resultList, ...newTasks, ...newList];
    };

    event.on('update', update);

    request(config.receiver).then(context => {

        let colseHandle = null;
    
        const resetCloseHandle = () => {
            clearTimeout(colseHandle);
            colseHandle = null;
        };
    
        const delay = (fileName = '') => {
            resetCloseHandle();
            colseHandle = setTimeout(() => {
                context.end();
                throw new Error(`${fileName} 上传超时！`);
                
            }, timeout * 1000);
        };
    
        context.on('data', res => {
            const {fileName, error} = JSON.parse(res);
            delay(fileName);
            resultList.push(fileName || error);
            if (resultList.length === fileList.length) {
                event.off('update', update);
                context.end();
                resetCloseHandle();
                callBack && callBack();
            }
            if (error) {
                throw new Error(error);
            } else {
                const file = fileList.find(item => item.remotePath === fileName);
                console.log(file.localPath, '\t', '=>', '\t', fileName);
            }
        });
        delay();
        let current = 0;
        while (current < fileList.length) {
            const file = fileList[current];
            const {localPath, remotePath} = file;
            if (fs.existsSync(localPath)) {
                const {size} = fs.statSync(localPath);
                const md5 = computMd5(localPath);
                const config = {remotePath, size, md5};
                const dataString = `$${JSON.stringify(config)}$`;
                const buffer = Buffer.alloc(dataString.length);
                buffer.fill(dataString);
                context.write(buffer);
                console.log(buffer.length);
                context.write(Buffer.alloc(2, '\r\n', 'utf8'));
                syncFileContent(localPath, size, context);
            }
            current++;
        }
    }).catch(err => {
        throw err;
    });    
};

module.exports = {
    push
};
