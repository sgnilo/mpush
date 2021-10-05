const fs = require('fs');
const path = require('path');
const event = require('../util/event.ts');

/**
 * 
 * @description 获取指定目录中的所有文件的路径
 * @param {string} dir 目录
 * @returns {array} 该目录中所有的文件
 */
const getFileList = dir => {
    const fileList = [];
    (function reduceUntilFile(p){
        !fs.statSync(p).isDirectory()
        ? fileList.push(p)
        : fs.readdirSync(p).forEach(file => reduceUntilFile(path.resolve(p, file)));  
    })(dir);
    return fileList;
};

/**
 * 
 * @description 给指定的目录或文件设置watcher
 * @param {string} dir 文件名或目录
 * @param {number} delay 延时，用于限制频繁的改动，默认3000ms
 */
const setDirWatcher = (dir, delay) => {
    let delayHandler = null;
    let changeFileList = [];

    fs.watch(dir, {recursive: true}, (e, fileName) => {
        const fullName = fs.statSync(dir).isDirectory() ? path.resolve(dir, fileName) : dir;
        !changeFileList.includes(fullName) && changeFileList.push(fullName);
        clearTimeout(delayHandler);
        delayHandler = setTimeout(() => {
            event.fire('fileChange', changeFileList);
            changeFileList = [];
        }, delay || 3000);
    });
};

module.exports = {
    getFileList,
    setDirWatcher
}

    