#!/usr/bin/env node

import {getFileList, setDirWatcher} from './file';
import {push} from './push';
import event from '../util/event';
const config = require('./config');
const path = require('path');
const fs = require('fs');

interface Rule {
    test: RegExp;
    path: string;
};

interface Config {
    watch: boolean;
    dir: string;
    remotePath: string;
    rules: Rule[];
}

let {watch, dir, remotePath, rules} = config as Config;

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

if (watch) {
    setDirWatcher(absolutePath);
    event.on('fileChange', (fileList: string[]) => {
        const newList = computeFileList(fileList);
        isPushing ? event.fire('update', newList) : push(newList, () => isPushing = false);
    });
}

push(fileList, () => isPushing = false);
