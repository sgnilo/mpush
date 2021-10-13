import * as crypto from 'crypto';
import * as fs from 'fs';

const computMd5 = (filePath: string) => {
    let md5Str = '';
    let content = Buffer.alloc(5000);
    let current = 0;
    const fd = fs.openSync(filePath, 'r');
    while (fs.readSync(fd, content, 0, 5000, current)) {
        current += 5000;
        md5Str += crypto.createHash('md5').update(content).digest('hex');
        content = Buffer.alloc(5000);
    }
    fs.closeSync(fd);

    return crypto.createHash('md5').update(md5Str).digest('hex');
};

export {
    computMd5
};