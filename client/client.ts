#!/usr/bin/env node
import {getFileList, setDirWatcher} from './file';
import {push} from './push';
import event from '../util/event';
const config = require('./config');
const path = require('path');
const fs = require('fs');

let {watch, dir, remotePath, rules} = config as any;

let fullPath = dir;

if (!/^\//g.test(dir)) {
    fullPath = path.resolve(__dirname, dir);
}

const computeFileList = fl => {
    return fl.map(file => {
        let p = remotePath;
        let remoteFile = '';
        rules && rules.forEach(rule => {
            if (rule.rule && rule.rule.test(file)) {
                p = rule.path;
            }
        });
        if (fs.statSync(fullPath).isDirectory()) {
            remoteFile = path.join(p + file.replace(fullPath, ''));
        } else {
            remoteFile = p;
        }
        return {
            localPath: file,
            remotePath: remoteFile
        };
    });
};

let isPushing = false;

const fileList = computeFileList(getFileList(fullPath));

isPushing = true;

if (watch) {
    setDirWatcher(fullPath);
    event.on('fileChange', fl => {
        const pfl = computeFileList(fl);
        if (isPushing) {
            event.fire('update', pfl);
        } else {
            push(pfl, () => {
                isPushing = false;
            });            
        }
    });
}

push(fileList, () => {
    isPushing = false;
});
