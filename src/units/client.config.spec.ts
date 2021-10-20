import config from '../client/config';

jest.mock('process', () => {
    return {
        argv: ['node', '--config=', '--config=./cpush.conf.js'],
        env: {
            PWD: '/Users/xujiangping/baidu/goodcoder/xujiangping'
        }
    };
});

describe('Test Config Assign', () => {

    it('test config', () => {
        expect(config).toHaveProperty('receiver');
        expect(config).toHaveProperty('dir');
        expect(config).toHaveProperty('remotePath');
    });
});
