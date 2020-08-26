module.exports = {
  collectCoverage: true,
  testTimeout: 20000,
  roots: [
    '<rootDir>/src'
  ],
  testMatch: [
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
};