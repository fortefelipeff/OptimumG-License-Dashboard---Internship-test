# Phase 1 ? Planning Notes

## 1. Objectives & Success Criteria
- Deliver a license management dashboard in React that communicates with a C++ addon via Node N-API.
- Backend must follow OOP principles (SRP) and expose activation, deactivation, querying, and status logic.
- Provide a polished UX (inspired by OptimumTire2) with clear feedback, responsive layout, and error handling.
- Maintain clean git history and documentation; optional automated tests improve score.

## 2. Personas & Use Cases
- **License Administrator** ? activates/deactivates licenses, monitors usage per machine/user, tracks expiration.
- **Support Technician** ? quickly checks status when assisting customers, may reset or extend licenses.

Use cases:
1. View list of licenses with key info (owner, type, status, expiration, remaining days, machine assignments).
2. Inspect details for a selected license, including activation history and allowed seats.
3. Activate license for a machine (input key + machine ID, validate, persist, update remaining seats).
4. Deactivate license (free machine slot, mark status accordingly).
5. Highlight licenses nearing expiration or already expired; filter/sort.
6. Handle invalid operations with descriptive errors (e.g., activate already-full license, unknown key).

## 3. Data Modeling
### 3.1 Domain Objects
- `LicenseStatus`: `Active`, `Inactive`, `Expired`, `Pending`, `Revoked`.
- `LicenseTier`: optional enumeration (e.g., `Trial`, `Standard`, `Pro`, `Enterprise`).
- `License` fields:
  - `key` (string, unique)
  - `productName`
  - `ownerName` / `company`
  - `activationLimit` (machines allowed)
  - `activations` (vector of `Activation`)
  - `issuedAt`, `expiresAt`
  - `status` (derived from logic + manual overrides)
  - `notes` (optional message)
- `Activation` fields:
  - `machineId`
  - `activatedAt`
  - `activatedBy`
  - `lastHeartbeat` (optional)

### 3.2 Repository Strategy
- For the test: in-memory storage seeded with mock data (vector/map in C++).
- Encapsulate data access in `LicenseRepository` (responsible for CRUD on licenses/activations).
- Future-friendly: interface to swap for persistent store.

## 4. Backend Architecture Plan
- `License` + related structs in header.
- `LicenseRepository` class: store, retrieve, update license objects (single responsibility: data access).
- `LicenseService` (or `ManageLicense`) class: business logic (activation rules, status computation, expiration checks).
- `LicenseMapper` helper to convert C++ structs ? N-API JS objects.
- Expose N-API functions: `listLicenses`, `getLicense`, `activateMachine`, `deactivateMachine`, `getStatus`, `getRemainingDays`.
- Error handling: throw C++ exceptions or return optional status codes mapped to JS errors.

## 5. Frontend Feature Plan
- Layout baseline: sidebar/table of licenses + detail pane (per screenshot).
- Components:
  - `LicenseList` (table with search/filter, status chips).
  - `LicenseDetails` (cards showing owner, dates, machine activations, actions).
  - `ActivationForm` (fields for license key + machine ID, submit triggers backend call).
  - `DeactivateDialog` (confirm removal of machine).
  - `StatusIndicators` (badges for remaining days, warnings for near-expiry).
- State management: React Query (for server cache) + local state for selected license.
- Feedback: global snackbar/toast, loading spinners, inline validation messages.

## 6. API Contract (Draft)
If exposing via Express:
- `GET /api/licenses` ? list all licenses.
- `GET /api/licenses/:key` ? license details.
- `POST /api/licenses/:key/activate` body `{ machineId, user }` ? returns updated license.
- `POST /api/licenses/:key/deactivate` body `{ machineId }` ? returns updated license.
- `GET /api/licenses/:key/status` ? `{ status, remainingDays }`.
Response format: JSON with consistent casing; include `error` field for failures.

If using direct Electron bridge, equivalent methods exposed via preload.

## 7. UX Polishing Checklist
- Sortable columns, search by key/owner.
- Highlight rows when remaining days <= 7.
- Empty states and skeleton loaders.
- Accessibility: keyboard navigation, ARIA labels on buttons/modals.
- Theming consistent with OptimumG colors (blue/orange) but subtle.

## 8. Documentation & Git
- Track decisions in `PLAN.md`/`README.md`.
- Commit after each milestone (backend data model, service logic, API, frontend skeleton, integration, polish).
- Update README with requirements, setup, commands, architecture overview.
- Optional: include testing strategy and manual test checklist.

## 9. Risks & Mitigations
- **Time sink no backend**: build minimal in-memory repo first, stub data to unblock frontend.
- **N-API marshaling complexity**: create helper functions early, add integration test that calls addon from Node.
- **UI scope creep**: lock MVP features; extras (filters, export) only if time allows.
- **Windows build issues**: keep Native Tools prompt for all addon builds; document commands.

## 10. Next Actions
1. Finalize domain types (`ManageLicense.h`) and diagram interactions.
2. Seed mock data and outline backend classes in C++.
3. Decide middleware approach (Express vs direct) and scaffold structure.

## Phase 2 ? Backend & Frontend Implementation Plan (Detailed)

1. Backend TypeScript wrapper
   - Create `src/backend/index.ts` to load the compiled addon via `require` and expose typed functions.
   - Define TS interfaces mirroring `License`, `Activation` etc. (ISO string dates).
   - Add error handling: convert boolean returns into thrown errors when operations fail.
   - Update `package.json` scripts: `build:addon`, `build:backend`, `start:backend`.

2. API Layer (Express)
   - Install dependencies: `express`, `cors`, `zod` (for payload validation).
   - Create `src/server/app.ts`: define routes `/api/licenses`, `/api/licenses/:key`, activation/deactivation endpoints.
   - Implement validation + response shaping; map addon errors to HTTP codes.
   - Add entry point `src/server/index.ts` to start server at configurable port.
   - Update `tsconfig.json` include paths and emit to `dist/`; add `npm scripts` (`dev:server`, `build:server`).

3. Frontend setup
   - Scaffold Vite React app under `frontend/` (`npm create vite@latest frontend -- --template react-ts`).
   - Configure shared env (`.env`, `VITE_API_BASE_URL`).
   - Install UI libs: `@mui/material`, `@emotion/react`, `@emotion/styled`, `@mui/icons-material`, `@tanstack/react-query`.
   - Set up Axios or fetch wrapper for API calls.

4. Frontend architecture
   - Build layout: sidebar/table + detail pane; create components: `LicenseTable`, `LicenseDetails`, `ActivationDialog`, `NotificationProvider`.
   - Integrate React Query for data fetching/mutations (refresh on success).
   - Implement state for selected license, filters, error handling.
   - Apply styling consistent with reference screenshot.

5. Testing & tooling
   - Optional: add Jest/ts-jest for backend logic tests.
   - Optional: add Playwright config for key UI flows.
   - Document manual test scenarios in README.

6. Documentation & cleanup
   - Update README with new scripts (build/run backend, start frontend).
   - Explain architecture: C++ addon ? TS wrapper ? Express ? React.
   - Add instructions for running both servers concurrently (e.g., `npm run dev:server` + `npm --prefix frontend run dev`).

Next immediate tasks: 1) implement TypeScript wrapper & Express API; 2) scaffold frontend once backend endpoints are available.
