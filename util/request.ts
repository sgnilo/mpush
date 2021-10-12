const net = require('net');

const request = (receiver: string) => {

    return new Promise((resolve, reject) => {
        const remote = receiver.replace(/http(s.)\/\//g, '').split(':');
        const socket = net.connect(remote[1] || 80, remote[0]);

        socket.setEncoding('utf-8');

        socket.on('connect', () => resolve(socket));

        socket.on('error', (err: Error) => reject(err));
    });
    
};

export {
    request
}