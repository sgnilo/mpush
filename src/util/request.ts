import {Resolve, Reject, Socket} from '../types/index';

const net = require('net');


const request = (receiver: string) => {

    return new Promise((resolve: Resolve, reject: Reject) => {
        const remote = receiver.replace(/http(s.)\/\//g, '').split(':');
        const socket: Socket = net.connect(remote[1] || 80, remote[0]);

        socket.setEncoding('utf-8');

        socket.on('connect', () => resolve(socket));

        socket.on('error', (err: Error) => reject(err));
    });
    
};

export {
    request
}