---
description: Rules for testing the application, focusing on business logic and modular architecture.
---

# Testing Rules & Workflow

Follow these rules when writing tests for `canfeed-web`. Our goal is maximum confidence with minimum maintenance, focusing on **Business Logic** and **User Behavior**.

## 1. Core Principles

- **Test Logic, Not Libs**: Do not test external libraries (e.g., shadcn/ui, Radix, Lucide). Test **our usage** and the **behavior** of our components.
- **Research First**: Do not blindly implement test patterns. If in doubt, **search the official documentation** (Vitest/Playwright) or the web first.
- **No Any**: Strictly avoid using `any` in tests. Use proper types or explicit mocks (e.g., `vi.mocked`).
- **Centralized Tests**: All tests reside in `src/__tests__`, mirroring the structure of the `src` directory. Do not introduce new folders within existing feature or app directories.
- **The Testing Trophy**:
    - **Static**: TypeScript for type safety.
    - **Unit**: Pure logic in `services.ts` and utility functions.
    - **Integration**: Component interaction, Server Actions, and state management.
    - **E2E**: Critical user journeys (Login, Workspace creation, Commenting).

## 2. Directory Structure

Place tests in `src/__tests__`, mimicking the internal structure of `src`:
```text
src/
├── features/
│   └── [feature-name]/
│       ├── services.ts
│       └── actions.ts
└── __tests__/
    └── features/
        └── [feature-name]/
            ├── services.test.ts    # Logic for data fetching/processing
            └── actions.test.ts     # Server Action bridges and mutations
```

## 3. What to Test

### Data Logic (`services.ts`)
- Test edge cases in filtering, sorting, and data transformation.
- Mock database calls using `drizzle-kit` or equivalent mocking strategy.
- Focus: "Given input X, does the service return correctly formatted Y?"

### Server Actions (`actions.ts`)
- Test validation logic and error handling.
- Verify that actions properly call services and handle revalidation.
- Focus: "Does the action handle unauthorized access? Does it return the expected serializable result?"

### Components (`components/`)
- **Integration over Unit**: Test how a "Molecule" or "Orchestrator" works as a whole.
- **Accessibility & Roles**: Use `getByRole`, `getByLabelText` etc. avoid `data-testid` unless necessary.
- **No Snapshot Testing**: Avoid brittle snapshots. Assert on visible text/UI states instead.
- Focus: "When I click 'Submit', does the 'Success' message appear?"

## 4. Tooling & Commands

- **Vitest**: For Unit and Integration tests.
    - `npm run test`: Run all tests.
    - `npm run test:watch`: Development mode.
- **Playwright**: For E2E tests.
    - `npx playwright test`: Run browser tests.

## 5. Avoid These Pitfalls

- ❌ Testing internal state or private functions.
- ❌ Testing CSS styles or decorative elements.
- ❌ Over-mocking: If you mock everything, you aren't testing the integration.
- ❌ Testing ShadUI component internals (e.g., "Does the button have a rounded corner?").
