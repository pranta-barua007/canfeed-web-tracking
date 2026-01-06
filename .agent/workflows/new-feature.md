---
description: How to create a new feature following the project's modern architecture
---

# Feature Architecture Workflow

Follow these steps when implementing a new feature in `canfeed-web`.

### 0. Implementation Rules
- **Research First**: Do not blindly implement solutions. If in doubt, **search the official documentation** or the web first.


### 1. Structure
Create a new directory in `src/features/[feature-name]` with the following structure:
```text
src/features/[feature-name]/
├── components/       # Feature-specific UI components
├── services.ts       # Server-only data fetching (Queries)
├── actions.ts        # Server Actions (Mutations & Client Bridges)
├── types.ts          # Feature-specific types. STRICTLY AVOID 'any'.
└── constants.ts      # (Optional) Feature constants
```

**Type Safety**: strictly avoid using `any`. Define proper interfaces/types in `types.ts` or reuse existing ones.

### 2. Data Fetching (Services)
- Always add `import 'server-only';` at the top of `services.ts`.
- **Pure Functions**: Keep queries concentrated on data retrieval, free from framework-specific wrappers.
- Services should not be imported directly by Client Components.

### 3. Mutations & Bridges (Actions)
- Use `"use server";` at the top of `actions.ts`.
- **Memoization**: In "bridge" actions that call services, wrap the calls with React's `cache` if the data is needed multiple times within a single request (e.g., for layouts or metadata).
- Implement mutations (create, update, delete).
- If a Client Component needs to call a `server-only` service, create a "bridge" action in `actions.ts` that simply calls the service.

### 4. Components & Atomic Design
- **Atomic Decomposition**: Favor breaking down feature orchestrators (e.g., `CommentsSidebar`) into smaller, focused units (`CommentItem`, `CommentEmptyState`).
- **Placement Rules**:
    - **Global Atoms**: If an atom is truly generic (e.g., `DeviceIcon`) and used/useful across multiple features, place it in `src/components/ui/`.
    - **Local Molecules**: Keep feature-specific logic (e.g., `WorkspaceGroup`) inside the feature's `components/` directory.
- **Composition**: Use composition to pass data and callbacks down, keeping child components pure and easily testable.

### 5. Performance & UX Patterns
- **Streaming with `use(promise)`**: Favor initiating data fetches in Server Components and passing the *promise* to Client Components. Use React's `use` hook to resolve it, enabling granular streaming.
- **Snappy UI with `useDeferredValue`**: Wrap search terms or filter inputs in `useDeferredValue` to prevent heavy filtering logic from blocking the main UI thread.
- **Suspense & Skeletons**: Every asynchronous component orchestrator should have a corresponding `Skeleton` or loading state for use in `Suspense` fallbacks.

### 6. Side Effects & Stabilization
- **Stable Callbacks**: Use `useEffectEvent` to wrap callbacks that are used inside `useEffect` but shouldn't trigger the effect when they change.
- **Preventing Render Loops**: Decouple reactive dependencies from non-reactive logic. If a dependency change should trigger a fetch/reset, call a `useEffectEvent` wrapped function inside the effect.
- **Ref Pattern**: For stabilizing callbacks within `useCallback` or other hooks where `useEffectEvent` is restricted, use the `useRef` pattern to maintain a stable reference to the latest function.

### 7. Integration
- Import feature orchestrators into the appropriate `src/app/` routes.
- Keep `src/app/` files lean, focusing only on routing, page-level metadata, and high-level layout.
- Use `Next/dynamic` for client-only canvas or heavy components to improve initial load.

### 8. Git Workflow & Conventions
- **Atomic Commits**: Stage and commit changes in logical, granular units. Avoid giant "refactor everything" commits.
- **Convention**: Follow [Conventional Commits](https://www.conventionalcommits.org/):
    - `feat(feature-name): add new component`
    - `refactor(feature-name): decouple logic into atoms`
    - `fix(feature-name): resolve state syncing bug`
- **Separate Staging**: stage files individually or in small groups (e.g., `git add path/to/file && git commit -m '...'`) to maintain high git history clarity.
