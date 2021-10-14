#!/usr/bin/env node

import {getFileList, setDirWatcher} from './file';
import {Push} from './push';
import event from '../util/event';
import {ClientConfig} from '../types/index';
import config from './config';
const path = require('path');
const fs = require('fs');


let {watch, dir, remotePath, rules} = config as ClientConfig;

let absolutePath = dir;


let isPushing = false;

if (!/^\//g.test(dir)) {
    absolutePath = path.resolve(__dirname, dir);
}

const isDir = fs.statSync(absolutePath).isDirectory();

const computeFileList = (fileList: string[]) => {
    return fileList.map(file => {
        let p = remotePath;
        let remoteFile = '';
        rules && rules.forEach(rule => {
            rule.test && rule.test.test(file) && (p = rule.path);
        });
        remoteFile = isDir ? path.join(p + file.replace(absolutePath, '')) : p;
        return {
            localPath: file,
            remotePath: remoteFile
        };
    });
};


const fileList = computeFileList(getFileList(absolutePath));

isPushing = true;

const finishCallBack = () => isPushing = false;

if (watch) {
    setDirWatcher(absolutePath);
    event.on('fileChange', (fileList: string[]) => {
        const newList = computeFileList(fileList);
        isPushing ? event.fire('update', newList) : new Push(newList, finishCallBack);
    });
}

new Push(fileList, finishCallBack);
