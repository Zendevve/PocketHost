/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  moduleNameMapper: {
    '^expo-file-system$': '<rootDir>/src/__mocks__/expo-file-system.ts',
    '^@react-native-async-storage/async-storage$': '<rootDir>/src/__mocks__/async-storage.ts',
  },
  collectCoverageFrom: ['src/services/**/*.ts', '!src/**/*.d.ts'],
};
