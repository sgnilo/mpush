const fs = require('fs');
import config from './config';
import {request} from'../util/request';
import event from '../util/event';
import {computMd5} from '../util/md5';
import {Task, TaskList} from '../util/task';
import {ClientConfig, Done, ResData, File, CommonCallBack, Socket} from '../types/index';


const {chunkSize, timeout, receiver} = config as ClientConfig;

/**
 * 
 * @description 在event中订阅该任务完成时的回调，并在完成时注销订阅
 * @param taskId 任务名
 * @param done 用于结束的回调，在所有都执行完毕时主动调用
 */
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
        request(receiver).then(this.onConnect.bind(this));
    }

    /**
     * 
     * @description 创建连接完成后绑定接受服务端响应的回调，并开始执行同步
     * @param context 连接的socket
     */
    onConnect(context: Socket) {
        this.context = context;
        this.context.on('data', this.response.bind(this));
        this.sync();
    }

    /**
     * 
     * @description 向文件列表合并更新新的文件列表
     * @param newList 新的变更的文件列表
     */
    update(newList: File[]) {
        const notFinishedList = this.fileList.filter(file => !this.resultList.includes(file));
        const newTasks = notFinishedList.filter(file => !newList.includes(file));
        this.fileList = [...this.resultList, ...newTasks, ...newList];
    }

    /**
     * 
     * @description 一个timeout函数，当长时间无响应或无动作时退出
     * @param fileName 正在执行同步的文件名
     */
    delay(fileName?: string) {
        this.resetCloseHandle();
        this.colseHandle = setTimeout(() => {
            this.context.end();
            throw new Error(`${fileName} 上传超时！`);
            
        }, timeout * 1000);
    }

    /**
     * 
     * @description 重置定时器
     */
    resetCloseHandle() {
        clearTimeout(this.colseHandle);
        this.colseHandle = null;
    }

    /**
     * 
     * @description 设定定时器，并循环同步文件
     */
    sync() {
        this.delay();
        let current = 0;
        while (current < this.fileList.length) {
            this.syncSingleFile(this.fileList[current]);
            current++;
        }
    }

    /**
     * 
     * @description 单个文件的同步方法，采用异步task的形式按序执行
     * @param file 文件对象，包含本地路径和目的路径
     */
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

    /**
     * 
     * @description 将同步文件信息的部分生成一个异步task参数对象
     * @param localPath 本地路径
     * @param remotePath 目的路径
     * @returns 用于初始化异task的参数对象
     */
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

    /**
     * 
     * @description 将同步文件内容的部分生成一个异步task参数对象
     * @param localPath 本地路径
     * @returns 用于初始化异task的参数对象
     */
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

    /**
     * 
     * @description 响应来自服务端的数据，并根据数据来决定完成还是执行下一步
     * @param res 来自服务端的数据文本
     */
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

    /**
     * 
     * @description 当一个文件同步完成时的回调，会向控制台打印同步信息
     * @param data 解析过后的来自服务端的数据
     */
    fileSyncFinish(data: ResData) {
        const {fileName, isSingleFileFinish, localFileName} = data;
        if (isSingleFileFinish) {
            const file = {remotePath: fileName, localPath: localFileName};
            this.resultList.push(file);
            console.log(
                '\x1b[34m', this.getFormatDate(),
                '\x1b[0m', localFileName,
                '\x1b[32m', '=>',
                '\x1b[0m', fileName
            );
        }
    }

    /**
     * 
     * @description 序列化一个包含时分秒的字符串
     * @returns 序列化后的时间字符串
     */
    getFormatDate() {
        const now = new Date();
        return `[${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}]`;
    }

    /**
     * 
     * @description 当所有文件同步完成后的回调，用于关闭同步
     */
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
