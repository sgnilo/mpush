import {Parser} from '../util/parser';

jest.useFakeTimers();

describe('Test Parser', () => {

    it('test parse method', () => {
        const buffer = Buffer.alloc(1000);
        const taskId = 'config-push-task';
        const localFileName = '/1/2.js';
        const remotePath = '/3/4';
        const config = `$${JSON.stringify({taskId, localFileName, remotePath})}`;
        const content = '这是一段内容';

        const parser = new Parser();

        const beforeCb = jest.fn();
        const configFinishCb = jest.fn((config) => {
            expect(config.taskId).toBe(taskId);
            expect(config.localFileName).toBe(localFileName);
            expect(config.remotePath).toBe(remotePath);
        });

        const contentFinishCb = jest.fn();
        const roundCb = jest.fn();

        parser.on('beforeParse', beforeCb);
        parser.on('parseConfigFinish', configFinishCb);
        parser.on('parseContentFinish', contentFinishCb);
        parser.on('roundParseFinish', roundCb);


        parser.parse(Buffer.alloc(config.length, config));
        parser.parse(Buffer.alloc(1, '$'));

        expect(beforeCb).toHaveBeenCalled();
        expect(configFinishCb).toHaveBeenCalled();
        expect(roundCb).toHaveBeenCalled();

        expect(contentFinishCb).not.toHaveBeenCalled();

        parser.parse(Buffer.alloc(content.length, content));
        parser.parse(Buffer.alloc(2, '\r\n'));

        jest.runAllTimers();

        expect(contentFinishCb).toHaveBeenCalled();
    });
});
