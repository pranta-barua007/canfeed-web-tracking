---
description: How to create a new feature following the project's modern architecture
---

# Feature Architecture Workflow

Follow these steps when implementing a new feature in `canfeed-web`.

### 1. Structure
Create a new directory in `src/features/[feature-name]` with the following structure:
```text
src/features/[feature-name]/
├── components/       # Feature-specific UI components
├── services.ts       # Server-only data fetching (Queries)
├── actions.ts        # Server Actions (Mutations & Client Bridges)
├── types.ts          # Feature-specific TypeScript types
└── constants.ts      # (Optional) Feature constants
```

### 2. Data Fetching (Services)
- Always add `import 'server-only';` at the top of `services.ts`.
- Keep queries pure and focused on data retrieval.
- Services should not be imported directly by Client Components.

### 3. Mutations & Bridges (Actions)
- Use `"use server";` at the top of `actions.ts`.
- Implement mutations (create, update, delete).
- If a Client Component needs to call a `server-only` service, create a "bridge" action in `actions.ts` that simply calls the service.

### 4. Components & Atomic Design
- **Atomic Decomposition**: Favor breaking down feature orchestrators (e.g., `CommentsSidebar`) into smaller, focused units (`CommentItem`, `CommentEmptyState`).
- **Placement Rules**:
    - **Global Atoms**: If an atom is truly generic (e.g., `DeviceIcon`) and used/useful across multiple features, place it in `src/components/ui/`.
    - **Local Molecules**: Keep feature-specific logic (e.g., `WorkspaceGroup`) inside the feature's `components/` directory.
- **Composition**: Use composition to pass data and callbacks down, keeping child components pure and easily testable.

### 5. Git Workflow & Conventions
- **Atomic Commits**: Stage and commit changes in logical, granular units. Avoid giant "refactor everything" commits.
- **Convention**: Follow [Conventional Commits](https://www.conventionalcommits.org/):
    - `feat(feature-name): add new component`
    - `refactor(feature-name): decouple logic into atoms`
    - `fix(feature-name): resolve state syncing bug`
- **Separate Staging**: stage files individually or in small groups (e.g., `git add path/to/file && git commit -m '...'`) to maintain high git history clarity.

### 6. Integration
- Import feature orchestrators into the appropriate `src/app/` routes.
- Keep `src/app/` files lean, focusing only on routing, page-level metadata, and high-level layout.
- Use `Next/dynamic` for client-only canvas or heavy components to improve initial load.
