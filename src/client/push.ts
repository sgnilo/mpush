const fs = require('fs');
const config = require('./config');
import {request} from'../util/request';
import event from '../util/event';
import {computMd5} from '../util/md5';
import {Task, TaskList} from '../util/task';
import {ClientConfig, Done, ResData, File, CommonCallBack, Socket} from '../types/index';


const {chunkSize, timeout} = config as ClientConfig;

const setTaskEvent = (taskId: string, done: Done) => {
    const netCallBack = (e: ResData) => {
        event.off(taskId, netCallBack);
        e && !e.status && done && done();
    };
    event.on(taskId, netCallBack);
};

class Push {
    fileList: File[];
    resultList: File[];
    callBack?: () => void;
    colseHandle: NodeJS.Timeout;
    context: Socket;
    taskList: TaskList;

    constructor(fileList: File[], callBack: CommonCallBack) {
        this.fileList = fileList;
        this.callBack = callBack;
        this.resultList = [];
        this.taskList = new TaskList();
        event.on('update', this.update.bind(this));
        request(config.receiver).then((context: Socket) => {
            this.context = context;
            context.on('data', this.response.bind(this));
            this.sync();
        });
    }

    update(newList: File[]) {
        const notFinishedList = this.fileList.filter(file => !this.resultList.includes(file));
        const newTasks = notFinishedList.filter(file => !newList.includes(file));
        this.fileList = [...this.resultList, ...newTasks, ...newList];
    }

    delay(fileName?: string) {
        this.resetCloseHandle();
        this.colseHandle = setTimeout(() => {
            this.context.end();
            throw new Error(`${fileName} 上传超时！`);
            
        }, timeout * 1000);
    }

    resetCloseHandle() {
        clearTimeout(this.colseHandle);
        this.colseHandle = null;
    }

    sync() {
        this.delay();
        let current = 0;
        while (current < this.fileList.length) {
            const file = this.fileList[current];
            this.syncSingleFile(file);
            current++;
        }
    }

    syncSingleFile(file: File) {
        const {localPath, remotePath} = file;
        if (fs.existsSync(localPath)) {
            const configTaskParam = this.makeSyncFileConfig(localPath, remotePath);
            const contentTaskParam = this.makeSyncFileContent(localPath);
            const configTask = new Task(configTaskParam);
            const contentTask = new Task(contentTaskParam);
            this.taskList.push(configTask);
            this.taskList.push(contentTask);
        }
    }

    makeSyncFileConfig(localPath: string, remotePath: string) {
        const taskId = `${localPath}-config-push`;
        const md5 = computMd5(localPath);
        const config = {remotePath, md5, taskId, localFileName: localPath};
        const _this = this;
        return {
            id: taskId,
            execute(done: Done) {
                setTaskEvent(taskId, done);
                const dataString = `$${JSON.stringify(config)}$`;
                const buffer = Buffer.alloc(dataString.length ,dataString);
                _this.context.write(buffer);
            }
        };
    }

    makeSyncFileContent(localPath: string) {
        const {size} = fs.statSync(localPath);
        let times = Math.floor(size / chunkSize);
        const lastChunk = size % chunkSize;
        let current = 0;
        const taskId = `${localPath}-content-push`;
        const _this = this;
        return {
            id: taskId,
            execute(done: Done) {
                setTaskEvent(taskId, done);
                const fd = fs.openSync(localPath);
                while (times >= 0) {
                    const thisTimeSize = times === 0 ? lastChunk : chunkSize;
                    let content = Buffer.alloc(thisTimeSize);
                    fs.readSync(fd, content, 0, thisTimeSize, current)
                    current += thisTimeSize;
                    _this.context.write(content);
                    times--;
                };
                fs.closeSync(fd);
                _this.context.write(Buffer.alloc(2, '\r\n'));
            }
        };
    }

    response(res: string) {
        const data = JSON.parse(res)
        const {fileName, error, taskId} = data as ResData;
        this.delay(fileName);
        this.fileSyncFinish(data);
        this.allFileSyncFinish();
        if (error) {
            throw error;
        } else {
            event.fire(taskId, data);
        }
    }

    fileSyncFinish(data: ResData) {
        const {fileName, isSingleFileFinish, localFileName} = data;
        if (isSingleFileFinish) {
            const file = {remotePath: fileName, localPath: localFileName};
            this.resultList.push(file);
            console.log(localFileName, '\t', '=>', '\t', fileName);
        }
    }

    allFileSyncFinish() {
        if (this.resultList.length === this.fileList.length) {
            event.off('update', this.update.bind(this));
            this.context.end();
            this.resetCloseHandle();
            this.callBack && this.callBack();
        }
    }
};

export {
    Push
};
