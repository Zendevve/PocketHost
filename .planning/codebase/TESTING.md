# TESTING

## Current State
- The repository presently lacks a formal testing framework (e.g., Jest or React Native Testing Library) as evidenced by the lack of test configurations in `package.json` and `.spec.ts` / `.test.tsx` files across the codebase.
- Type checking is utilized as an initial static analysis check during build loops (`npm run typecheck`).

## Recommendations
- **Unit Testing**: Introduce `jest` and `@testing-library/react-native` to ensure the complex UI logic and forms (e.g., modifying `server.properties`) operate flawlessly.
- **Service Mocking**: Testing the native module `modules/server-process` will require extensive mocking strategies to isolate UI testing from background process Java bindings. Using `jest.mock()` for core application domain bridges (`src/services/serverManager.ts`) will be vital.
