export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1"
    },
    testMatch: ['**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            useESM: true,
            tsconfig: 'tsconfig.json',
            diagnostics: {
                ignoreCodes: [1343]
            }
        }]
    },
    extensionsToTreatAsEsm: ['.ts'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    maxWorkers: 1,
};
