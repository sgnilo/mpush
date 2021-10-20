import config from '../server/config';

describe('Test Server Config', () => {

    it('test config', () => {
        expect(config).toHaveProperty('port');
    });
});
