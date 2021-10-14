import {getFileList, setDirWatcher} from '../client/file';
const path = require('path');

const testPath = '/1';

jest.mock('fs', () => ({
    watch: jest.fn((dir, option, callback) => {
        callback(null, '2.js');
    }),
    statSync: jest.fn((dir) => ({
        isDirectory: jest.fn(() => {
            return dir === '/1' ? true : false; 
        })
    })),
    readdirSync: jest.fn((dir) => ['2.js', '3.js'])
}));

const fs = require('fs');



describe('Test File Methods', () => {

    it('test getFileList', () => {
        const fileList = getFileList(testPath);
        expect(fileList.includes('/1/2.js')).toBeTruthy();
        expect(fileList.includes('/1/3.js')).toBeTruthy();
    });

    it('test setDirWatcher', () => {

        setDirWatcher(testPath, 0);
        expect(fs.watch).toHaveBeenCalled();
        jest.runAllTimers();
    });
});