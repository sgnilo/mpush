import { request } from '../util/request';

jest.mock('net', () => {
    let exeFn: string | number;
    const socket = {
        error: undefined,
        connect: undefined,
        setEncoding: jest.fn(),
        on: (fnName: string, cb: Function) => {
            if (exeFn !== fnName) {
                exeFn = fnName;
                cb && cb();
            }
        }
    } as any;
    return {
        connect: jest.fn((port: number, ip: string) => {
            return socket;
        })
    };
    
});

jest.useFakeTimers();

const net = require('net');

describe('Test Request Method', () => {
    it('test request while ok', () => {
        const okRec = 'http://10.0.3.4:80';

        const okReq = request(okRec);

        expect(net.connect).toHaveBeenCalled();
    });

    it('test request while no port', () => {
        const okRec = 'http://10.0.3.4';

        const okReq = request(okRec);

        expect(net.connect).toHaveBeenCalled();
    });

    it('test request while err', () => {
        const errRes = 'http://10.0.3.4:66666';

        const errReq = request(errRes);


        expect(net.connect).toHaveBeenCalled();
    });
});