# CONVENTIONS

## Code Style
- **Type Safety**: Strictly enforced via TypeScript compiler checks (see `package.json` with `tsc --noEmit`). Components and Store states are strongly-typed via interfaces housed primarily in `src/types/`.
- **Component Paradigms**: Heavy reliance on React Hooks for lifecycle mechanisms with functional components.
- **State Approach**: `zustand` is used pervasively for overarching application state via specific domain modules. Mutators and accessors live within the zustand store, decoupling them from UI components. Actions are generally executed async where necessary.

## Naming & Organization
- Custom UI components inside `src/components/ui/` act as pure, stylable components mimicking Atomic Design. File names match the component name (e.g. `Card.tsx` exports `<Card>`).
- Services suffix their name with 'Manager' or 'Service' and are typically exported as singletons or namespaces (e.g., `export const serverManager = new ServerManager()`).
- All internal configuration files adhere to strict naming conventions as expected by Expo (e.g., `app.json`, `babel.config.js`, `tsconfig.json`).

## Error Handling
- Errors are predominantly caught in asynchronous functions within the `src/services/` layer. Failures interact back with `zustand` error states allowing the UI layers to conditionally render `alert` banners or toasts.
- In native bindings (`modules/server-process`), process-level errors bridge via the `'onError'` event, captured safely by `serverManager.ts`.
