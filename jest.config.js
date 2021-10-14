module.exports = {
    collectCoverage: true,
    moduleFileExtensions: ['ts', 'js'],
    clearMocks: true,
    roots: ['./src/units'],
    transform: {
        '\.ts$': 'ts-jest'
    },
    testEnvironment: 'node'
}