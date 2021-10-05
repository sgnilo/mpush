const {request} = require('../util/request.ts');
const event = require('../util/event.ts');
const {computMd5} = require('../util/md5.ts');
const fs = require('fs');
const config = require('./config');
const path = require('path');
const {Task, TaskList} = require('../util/task.ts');

const {chunkSize, timeout} = config;
const taskList = new TaskList();

const syncFileContent = (filePath, fileSize, context) => {
    let times = Math.floor(fileSize / chunkSize);
    const lastChunk = fileSize % chunkSize;
    let current = 0;
    const taskId = `${filePath}-content-push`
    taskList.push(new Task({
        id: taskId,
        execute(done) {
            // console.log('新任务：', taskId);
            const fd = fs.openSync(filePath);
            while (times >= 0) {
                const thisTimeSize = times === 0 ? lastChunk : chunkSize;
                let content = Buffer.alloc(thisTimeSize);
                fs.readSync(fd, content, 0, thisTimeSize, current)
                current += thisTimeSize;
                context.write(content);
                times--;
            };
            fs.closeSync(fd);
            context.write(Buffer.alloc(2, '\r\n'));
            const netCallBack = e => {
                event.off(taskId, netCallBack);
                e && !e.status && done && done();
            }
            event.on(taskId, netCallBack);
        }
    }))
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
            const data = JSON.parse(res)
            const {fileName, error, taskId, isSingleFileFinish, localFileName} = data;
            delay(fileName);
            if (isSingleFileFinish) {
                resultList.push(fileName || error);
                console.log(localFileName, '\t', '=>', '\t', fileName);
            }
            if (resultList.length === fileList.length) {
                event.off('update', update);
                context.end();
                resetCloseHandle();
                callBack && callBack();
            }
            if (error) {
                throw new Error(error);
            } else {
                event.fire(taskId, data);
            }
        });
        delay();
        let current = 0;
        while (current < fileList.length) {
            const file = fileList[current];
            const {localPath, remotePath} = file;
            if (fs.existsSync(localPath)) {
                const taskId = `${localPath}-config-push`;
                const {size} = fs.statSync(localPath);
                const md5 = computMd5(localPath);
                const config = {remotePath, size, md5, taskId, localFileName: localPath};
                taskList.push(new Task({
                    id: taskId,
                    execute(done) {
                        // console.log('新任务：', taskId);
                        const netCallBack = e => {
                            event.off(taskId, netCallBack);
                            e && !e.status && done && done();
                        }
                        event.on(taskId, netCallBack);
                        const dataString = `$${JSON.stringify(config)}$`;
                        const buffer = Buffer.alloc(dataString.length);
                        buffer.fill(dataString);
                        context.write(buffer);
                    }
                }));
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
