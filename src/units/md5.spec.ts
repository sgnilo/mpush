import { computMd5 } from "../util/md5";

jest.mock('fs', () => {
    return {
        openSync: jest.fn(),
        readSync: jest.fn((fd, content, size, m, current) => {
            content.fill('test');
            return current <= 5000;
        }),
        closeSync: jest.fn()
    }
});

jest.mock('crypto', () => {
    return {
        createHash: () => ({
            update: () => ({
                digest: () => 'test hash'
            })
        })
    }
});

const fs = require('fs');

describe('Test Md5 Method', () => {

    it('test make md5 function', () => {
        const hash = computMd5('/1/2.js');
        expect(hash).toBe('test hash');
        expect(fs.openSync).toHaveBeenCalled();
        expect(fs.readSync).toHaveBeenCalled();
        expect(fs.closeSync).toHaveBeenCalled();
    });
});