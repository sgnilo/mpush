const eventMap = {};

type CallBack = (data: unknown) => void;

const on = (eventName: string, fn: CallBack) => {
    if (!eventMap[eventName]) {
        eventMap[eventName] = [];
    }
    eventMap[eventName].push(fn);
};

const fire = (eventName: string, data: unknown) => {
    eventMap[eventName] && eventMap[eventName].forEach(fn => {
        fn && fn(data);
    });
};

const off = (eventName: string, fn: CallBack) => {
    if (eventMap[eventName]) {
        const current = eventMap[eventName].findIndex(callBack => fn === callBack);
        current >= 0 && eventMap[eventName].splice(current, 1);
    }
};

export default {
    on,
    fire,
    off
}