const fs = require('fs');
const path = require('path');
const event = require('../util/event.ts');

const getFileList = dir => {
    const fileList = [];
    const reduceUntilFile = p => {
        if (!fs.statSync(p).isDirectory()) {
            fileList.push(p);
        } else {
            fs.readdirSync(p).forEach(file => reduceUntilFile(path.resolve(p, file)));
        }
        
    };
    reduceUntilFile(dir);
    return fileList;
};

const setDirWatcher = dir => {
    let delay = null;
    let changeFileList = [];

    const resetDelay = () => {
        clearTimeout(delay);
        delay = null;
    };
    fs.watch(dir, {recursive: true}, (e, fileName) => {
        const fullName = fs.statSync(dir).isDirectory() ? path.resolve(dir, fileName) : dir;
        !changeFileList.includes(fullName) && changeFileList.push(fullName);
        resetDelay();
        delay = setTimeout(() => {
            event.fire('fileChange', changeFileList);
            changeFileList = [];
        }, 3000);
    });
};

module.exports = {
    getFileList,
    setDirWatcher
}

    