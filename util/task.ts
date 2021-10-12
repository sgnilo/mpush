type Done = (taskStatus?: string) => void;
type Execute = (done: Done) => void;

interface TaskConstructorParam {
    id: string;
    execute: Execute;
}


class Task {
    execute: Execute;
    done: Done;
    taskId: string;
    taskStatus: string;
    constructor({id, execute}: TaskConstructorParam) {
        this.execute = execute;
        this.taskId = id;
        this.taskStatus = 'inited';
    }

    do() {
        if (this.execute) {
            this.taskStatus = 'executing';
            this.execute(this.done.bind(this));
        }
        if (!this.execute && this.taskStatus !== 'finished') {
            this.done();
        }
    }

    whileDone(done: Done) {
        this.done = () => {
            this.taskStatus = 'finished';
            done && done(this.taskStatus);
        };
    }

    getTaskId() {
        return this.taskId;
    }

    getTaskStatus() {
        return this.taskStatus;
    }

};



class TaskList {
    list: Task[];
    activeTask: Task;
    executing: boolean;
    constructor() {
        this.list = [];
        this.activeTask = null;
        this.executing = false;
    }

    push(task: Task, needAssign?: boolean) {
        needAssign && this.assign(task);
        task.whileDone(taskStatus => {
            taskStatus === 'finished' && process.nextTick(this.runTask.bind(this));
        });
        this.list.push(task);
        !this.executing && this.runTask();
    }

    assign(task: Task) {
        const current = this.list.findIndex(t => t.getTaskId() === task.getTaskId());
        current >= 0 && this.list.splice(current, 1);
    }

    runTask() {
        this.executing = true;
        if (this.list && this.list[0]) {
            const task = this.list.shift();
            this.activeTask = task;
        }
        (this.activeTask && this.activeTask.getTaskStatus() === 'inited') ? this.activeTask.do() : this.finish();
    }

    finish() {
        this.executing = false;
        this.activeTask = null;
    }

    retry() {
        this.executing = true;
        (this.activeTask && this.activeTask.getTaskStatus() !== 'finished') ? this.activeTask.do() : this.finish()
    }
};

export {
    Task,
    TaskList
}