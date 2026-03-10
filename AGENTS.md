# AGENTS.md

## Purpose
- This repository is a small SillyTavern UI extension with static JS/CSS/HTML files.
- This guide is for coding agents: keep edits safe, consistent, and low-risk.
- Preserve behavior unless a task explicitly requests behavior changes.

## Project Snapshot
- Runtime: browser context inside SillyTavern.
- Entry script: `index.js` (single IIFE, no bundler/module system).
- UI markup: `settings.html`.
- Styling: `style.css`.
- Extension metadata: `manifest.json`.
- No `package.json`, no CI workflow, no ESLint/Prettier config.

## Repository Layout
- `index.js`: settings normalization, range extraction, template logic, render/mount, event binding.
- `settings.html`: panel DOM structure and form controls.
- `style.css`: scoped extension styles (3-column overlay layout).
- `manifest.json`: extension loader metadata (`display_name`, `author`, `version`, `js`, `css`).
- `knowledge/*.md`: local mirrors/reference docs from SillyTavern.

## Authoritative References
- Official docs: <https://docs.sillytavern.app/for-contributors/writing-extensions/>
- Local mirror: `knowledge/Writing-Extensions.md`
- Event model reference: `knowledge/events.js`
- Extension context API reference: `knowledge/st-context.js`

## Build / Lint / Test Commands

### Build
- No build step exists in this repo.
- Normal workflow: edit files -> reload extension in SillyTavern.
- Do not assume `npm run build` or other script-based build commands exist.

### Lint / Static Checks
- JavaScript syntax check:
```bash
node --check index.js
```
- Manifest parse check:
```bash
node -e "JSON.parse(require('node:fs').readFileSync('manifest.json','utf8')); console.log('manifest ok')"
```
- There is no configured ESLint/Prettier command.

### Test
- There is currently no checked-in automated test suite.
- Validation is mainly manual in SillyTavern UI.
- Do not assume `npm test`/`pnpm test`/`yarn test` exists.

### Running a Single Test (Important)
- Currently not applicable (no tests in repository).
- If tests are added with Node's built-in runner, run one file:
```bash
node --test tests/some-feature.test.js
```
- Run one test case by name:
```bash
node --test --test-name-pattern "extractTextByRange"
```
- Recommended future unit-test targets: pure helpers in `index.js` (`extractTextByRange`, template apply, normalization helpers).

## Manual Verification Checklist
- Top bar button appears once, and panel opens/closes correctly.
- Range/template tab switching works.
- Manual trigger writes output into textarea.
- Incomplete tag pair and missing range tags show warning/error text.
- "Keep tags" option changes extraction output behavior.
- Template apply, long-press delete, and reset-to-default all work.
- Reload SillyTavern and confirm settings remain intact.

## Code Style Guidelines

### Architecture and Structure
- Keep `index.js` in one IIFE.
- Keep module constants near top (`MODULE_NAME`, paths, defaults, selectors).
- Maintain one central `SELECTORS` object for DOM ids/classes.
- Prefer small helper functions and early-return guard clauses.

### Imports and Dependencies
- Do not introduce ESM/CJS unless explicitly requested.
- Prefer `SillyTavern.getContext()` and shared globals (`SillyTavern`, `$`, `window`, `globalThis`).
- Keep graceful fallbacks for host APIs (e.g., Popup/toastr fallback paths).

### Formatting
- Use 4-space indentation in JS/HTML/CSS.
- Use semicolons in JavaScript.
- Prefer single quotes in JS unless template literals are needed.
- Keep long chains/expressions readable by splitting lines.

### Types and Data Normalization
- Treat host/context values as potentially missing or malformed.
- Normalize with explicit coercion (`String(value ?? '')`, `Boolean(...)`).
- Validate shape before use (`Array.isArray`, object/null guards).
- Preserve defaults when old or invalid settings shapes are loaded.

### Naming Conventions
- Constants: `UPPER_SNAKE_CASE`.
- Variables/functions: `camelCase`.
- DOM ids/classes: preserve `my-topbar-test-` prefix.
- Event namespaces: preserve `.myTopbarTest*` namespacing in jQuery handlers.
- Template IDs: keep stable generated IDs; never use array index as identity.

### Error Handling
- Wrap host-dependent calls in `try/catch` when failure is possible.
- Never leave empty catch blocks; log context with module prefix.
- Fail soft in UI handlers: notify user and keep panel usable.
- Avoid uncaught errors from user-triggered events.

### DOM and Events
- Use delegated handlers via `$(document).on(...)` for dynamic elements.
- Pair delegated binds with `.off(...)` before re-binding.
- Reuse selector constants instead of duplicating literal selectors.
- Guard missing elements before reading/updating (`if (!$el.length) return`).
- Preserve keyboard accessibility for clickable non-button controls.

### Settings and Persistence
- Persist only under `extensionSettings[MODULE_NAME]`.
- Load through normalization path (`loadSettings`).
- Save through `saveSettingsDebounced` wrapper (`savePluginSettings`).
- Maintain backward compatibility for older settings structures.
- Never store secrets or large payloads in `extensionSettings`.

### HTML/CSS Guidelines
- Keep existing ids stable; JS depends on them.
- Prefer semantic `<button>` for actions.
- Keep `label[for]` and input `id` pairs aligned.
- Prefer CSS classes over inline styles (except tiny structural placeholders).
- Scope CSS to extension selectors to avoid host-style leakage.
- Prefer SmartTheme variables (`--SmartTheme*`) before hard-coded colors.
- Preserve current 3-column overlay behavior and subtle motion timings.

## Behavior Invariants to Preserve
- Keep duplicate-load guard via global flag (`__myTopbarTestLoaded__`).
- Keep default output textarea text behavior.
- Preserve extraction semantics (both tags empty => full last message).
- Preserve long-press delete timing/confirmation flow.
- Preserve reset-to-default template behavior.
- Keep `settings.html` and `getPanelHtml()` structure in sync when editing panel markup.

## Agent Workflow Expectations
- For non-trivial edits, review `index.js`, `settings.html`, `style.css`, and `manifest.json` first.
- Keep edits minimal and aligned with existing architecture/patterns.
- Update JS + HTML/CSS together when selectors/structure change.
- After JS edits, run `node --check index.js`.
- After manifest edits, run the manifest parse command.
- Include a short manual verification note in your summary.

## Cursor / Copilot Rules Status
- `.cursorrules`: not found.
- `.cursor/rules/`: not found.
- `.github/copilot-instructions.md`: not found.
- If these files appear later, treat them as higher-priority local instructions and update this guide.
