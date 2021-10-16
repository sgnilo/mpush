import {Task, TaskList} from '../util/task';

jest.useFakeTimers();

describe('Test Task module', () => {

    it('test Task', () => {
        const taskId = 'test';
        const testCb = jest.fn(done => done());
        const task = new Task({
            id: taskId,
            execute: testCb
        });

        expect(task.taskId).toBe(taskId);
        expect(task.taskStatus).toBe('inited');

        const done = jest.fn(status => {});

        task.whileDone(done);

        task.do();

        expect(testCb).toHaveBeenCalled();
        expect(done).toHaveBeenCalled();
        expect(task.getTaskStatus()).toBe('finished');
    });

    it('test Task with useless', () => {
        const taskId = 'test';
        // @ts-ignore
        const task = new Task({
            id: taskId
        });

        expect(task.getTaskId()).toBe(taskId);
        expect(task.taskStatus).toBe('inited');

        const done = jest.fn(status => {});

        task.whileDone(done);

        task.do();
        expect(done).toHaveBeenCalled();
        expect(task.getTaskStatus()).toBe('finished');
    });

    it('test TaskList', () => {
        const taskId1 = 'test1';
        const taskId2 = 'test2';
        const testFuc1 = jest.fn(done => done());
        const testFuc2 = jest.fn(done => done());

        const taskList = new TaskList();

        const task1 = new Task({
            id: taskId1,
            execute: testFuc1
        });

        const task2 = new Task({
            id: taskId2,
            execute: testFuc2
        });

        taskList.push(task1);
        taskList.push(task2);

        jest.runAllTimers();

        expect(testFuc1).toHaveBeenCalled();
        expect(testFuc2).toHaveBeenCalled();
    });

    it('test TaskList while assign', () => {
        const taskId1 = 'test1';
        const taskId2 = 'test2';
        const taskId3 = 'test2';
        const testFuc1 = jest.fn(done => {
            setTimeout(() => done(), 0);
        });
        const testFuc2 = jest.fn(done => done());
        const testFuc3 = jest.fn(done => done());

        const taskList = new TaskList();

        const task1 = new Task({
            id: taskId1,
            execute: testFuc1
        });

        const task2 = new Task({
            id: taskId2,
            execute: testFuc2
        });

        const task3 = new Task({
            id: taskId3,
            execute: testFuc3
        });

        taskList.push(task1);

        taskList.retry();
        taskList.push(task2, true);
        taskList.push(task3, true);

        jest.runAllTimers();

        expect(testFuc1).toHaveBeenCalled();
        expect(testFuc2).not.toHaveBeenCalled();
        expect(testFuc3).toHaveBeenCalled();

        taskList.retry();
    });
});