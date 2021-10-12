// @ts-nocheck
function seeCallStack() {
    throw new Error();
};

import {Task, TaskList} from './util/task';

let i = 10;

const taskList = new TaskList();
taskList.push(new Task({
    id: 'test',
    execute(done) {
        setTimeout(() => {
            console.log('看看我在哪');
            done();
        }, 300);
    }
}))

while (i--) {
    const t = i;
    taskList.push(new Task({
        id: t,
        execute(done) {
            console.log(t);
                if (t === 1) {
                    // seeCallStack();
                }
                done();
        }
    }))
}
// @ts-check
