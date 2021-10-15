import event from '../util/event';

describe('Test Event Methods', () => {

    it('test on、fire', () => {
        const fn = jest.fn();
        event.on('test', fn);
        event.fire('test', null);

        expect(fn).toHaveBeenCalled();
    });

    it('test off', () => {
        const fn = jest.fn();
        event.on('test', fn);
        event.off('test', fn);
        event.off('test.off', fn);
        event.fire('test', null);

        expect(fn).not.toHaveBeenCalled();
    });
});