#!/usr/bin/env node

const net = require('net');
const fs = require('fs');
import {computMd5} from '../util/md5';
import {Parser} from '../util/parser';
import config from './config';
import {ActiveItem, ParseCallBackParam, Socket} from '../types/index';

/**
 * @description 根据路径创建文件，若路径不存在则递归创建父级目录
 * @param {string} filePath 文件路径
 */
const createFile = (filePath: string) => {
    const pathList = filePath.split('/');
    pathList.reduce((path, dir) => {
        path && !fs.existsSync(path) && fs.mkdirSync(path);
        return path + '/' + dir;
    });
    fs.writeFileSync(filePath, '', {flag: 'w'});
};


/**
 * @description 创建一个服务器
 */
const server = net.createServer();

/**
 * @description 当一个新连接被建立后的事件处理
 */
server.on('connection', (socket: Socket) => {
    
    /**
     * @description 创建一个解析器解析流内容
     */
    const parser = new Parser();

    /**
     * @description 当文件信息解析完成时调用，给请求方响应
     * @param {Object} activeFile 此时正处于处理中的文件信息
     */
    const parseConfigFinish = (activeFile: ActiveItem) => {
        createFile(activeFile.remotePath);
        socket.write(JSON.stringify({
            ...activeFile,
            fileName: activeFile.remotePath
        }));
    };

    /**
     * @description 当文件内容解析处理完成时异步调用，给请求方响应
     * @param {object} activeFile 此时正处于处理中的文件信息
     */
    const parseContentFinish = (activeFile: ActiveItem) => {
        if (computMd5(activeFile.remotePath) === activeFile.md5) {
            socket.write(JSON.stringify({
                ...activeFile,
                fileName: activeFile.remotePath,
                isSingleFileFinish: true
            }));
        }
    };

    /**
     * @description 在文件内容解析处理完成时同步调用，将处理后的buffer写入文件中
     * @param {object} data 包含触发此回调的类型、此round的buffer、处理中的文件信息
     */
    const roundParseFinish = (data: ParseCallBackParam) => {
        const {type, config, content} = data;
        type === 'content' && config && content && fs.writeFileSync(config.remotePath, content, {flag: 'as'});
    };

    parser.on('parseConfigFinish', parseConfigFinish);
    parser.on('parseContentFinish', parseContentFinish);
    parser.on('roundParseFinish', roundParseFinish);

    socket.on('data', (res: Buffer) => {
        try {
            parser.parse(res);
        } catch(err) {
            socket.write(JSON.stringify({error: err}));
        }
    });
});

server.listen(config.port, () => {
    console.log(`now is listening at :${config.port}`);
});