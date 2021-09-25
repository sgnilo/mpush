class Task {
    execute;
    done;
    taskId;
    taskStatus;
    constructor({id, execute}) {
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

    whileDone(done) {
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
    list;
    activeTask;
    executing;
    constructor() {
        this.list = [];
        this.activeTask = null;
        this.executing = false;
    }

    push(task, needAssign = false) {
        needAssign && this.assign(task);
        task.whileDone(taskStatus => {
            taskStatus === 'finished' && this.runTask();
        });
        this.list.push(task);
        !this.executing && this.runTask();
    }

    assign(task) {
        const current = this.list.findIndex(t => t.getTaskId() === task.getTaskId());
        current >= 0 && this.list.splice(current, 1);
    }

    runTask() {
        this.executing = true;
        if (this.list && this.list[0]) {
            const task = this.list.shift();
            this.activeTask = task;
        }
        (this.activeTask && this.activeTask.getTaskStatus() === 'inited') ? this.activeTask.do() : this.finish()
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

module.exports = {
    Task,
    TaskList
}