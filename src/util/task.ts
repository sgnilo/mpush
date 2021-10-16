import {Done, Execute, TaskConstructorParam} from '../types/index';
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

    /**
     * @description 任务执行方法
     */
    do() {
        if (this.execute) {
            this.taskStatus = 'executing';
            this.execute(this.done.bind(this));
        }
        if (!this.execute && this.taskStatus !== 'finished') {
            this.done();
        }
    }

    /**
     * @description 将一个用于任务执行结束后调用的回调函数挂载到任务上
     * @param done 任务执行结束的回调函数
     */
    whileDone(done: Done) {
        this.done = () => {
            this.taskStatus = 'finished';
            done && done(this.taskStatus);
        };
    }

    /**
     * 获取任务ID
     * @returns 任务ID
     */
    getTaskId() {
        return this.taskId;
    }

    /**
     * 获取任务执行状态
     * @returns 任务状态
     */
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

    /**
     * @description 将一个同步/异步任务push进任务队列
     * @param task 一个任务
     * @param needAssign 是否需要跟任务队列里已有的任务进行查找合并
     */
    push(task: Task, needAssign?: boolean) {
        needAssign && this.assign(task);
        task.whileDone(taskStatus => {
            taskStatus === 'finished' && process.nextTick(this.runTask.bind(this));
        });
        this.list.push(task);
        !this.executing && this.runTask();
    }

    /**
     * 在任务队列中查找比较早的同个任务，并去掉
     * @param task 任务
     */
    assign(task: Task) {
        const current = this.list.findIndex(t => t.getTaskId() === task.getTaskId());
        current >= 0 && this.list.splice(current, 1);
    }

    /**
     * @description 执行任务
     */
    runTask() {
        this.executing = true;
        if (this.list && this.list[0]) {
            const task = this.list.shift();
            this.activeTask = task;
        }
        (this.activeTask && this.activeTask.getTaskStatus() === 'inited') ? this.activeTask.do() : this.finish();
    }

    /**
     * @description 执行完成
     */
    finish() {
        this.executing = false;
        this.activeTask = null;
    }

    /**
     * @description 重试
     */
    retry() {
        this.executing = true;
        (this.activeTask && this.activeTask.getTaskStatus() !== 'finished') ? this.activeTask.do() : this.finish()
    }
};

export {
    Task,
    TaskList
}