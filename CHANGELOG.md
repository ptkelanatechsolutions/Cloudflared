# Changelog

# Cloudflared 1.10.0

Cloudflared `1.10.0` is a feature release focused on **performance monitoring**, **configuration management**, **UI/UX audit fixes**, and **test infrastructure**.

This release adds a live SVG performance graph for tunnel traffic and connections, an on-demand network diagnostics tool, an export/import configuration dialog, and a state history timeline. It also delivers a comprehensive UI/UX audit addressing accessibility, CSS variable correctness, layout stability, motion performance, keyboard shortcut conflicts, error boundary safety, and ignore file hygiene.

## Highlights

- Added live SVG performance graph with dual-path rendering for connections and bandwidth.
- Added network diagnostics dialog for on-demand binary, DNS, edge, and metrics checks.
- Added export/import configuration dialog with confirmation prompt.
- Added collapsible state history timeline in the Observability card.
- Added connector ID and edge location display with one-click copy.
- Added health API endpoint for Docker HEALTHCHECK.
- Chart colors now use dedicated `--color-chart-primary` and `--color-chart-secondary` tokens instead of misleading variable references.
- Save/Discard buttons moved from Token card to Settings card for a more intuitive workflow.
- Version notification tooltip is now keyboard-accessible with proper ARIA linking.
- Fixed `Ctrl+L` browser conflict — log shortcut changed to `Ctrl/Cmd+Shift+L`.
- ErrorBoundary "Try again" now safely remounts children via key pattern.
- Log preview animation changed from per-line `motion.div` to a single container animation.
- Added Vitest test infrastructure for both `@cloudflared/web` and `@cloudflared/core`.
- Comprehensive ignore file hygiene: `.gitignore`, `.dockerignore`, `.prettierignore` updated; empty `.npmignore` removed.

## Added

### Health API Endpoint

- Added `/api/health` route returning `200 OK` with a JSON status payload for Docker HEALTHCHECK and external monitoring.

### Performance Graph

- Added live SVG performance chart showing tunnel connections and bandwidth (egress rate) over the last ~120 data points.
- Dual-path rendering: connections in blue (`--color-chart-primary`), bandwidth in emerald (`--color-chart-secondary`).
- Auto-scaling Y-axis with byte unit labels (B/KB/MB) and relative time labels (s/m/h).
- Grid lines for visual reference and a legend showing peak connection count and bandwidth rate.
- Loading state differentiates between "Tunnel offline" (static icon, no spinner) and "Collecting metrics" (spinner).

### Network Diagnostics Dialog

- Added diagnostics panel accessible from the dashboard.
- Runs on-demand checks for cloudflared binary availability, DNS resolution, edge connectivity, and metrics endpoint.
- Displays per-check pass/fail status with descriptive messages and environment info (Node version, platform, arch).

### Export/Import Configuration

- Added export/import dialog for backing up and restoring tunnel configuration as JSON.
- Export optionally includes or excludes the tunnel token.
- Import applies the configuration and restarts the tunnel if active.
- Import now shows a `window.confirm()` prompt before overwriting to prevent accidental data loss.

### State History Timeline

- Added collapsible state history timeline in the Observability card.
- Shows the last 10 state transitions with color-coded status dots and relative timestamps.
- Uses staggered entry animation for a polished reveal.

### Connector Info Display

- Added connector ID (truncated, with copy button) and edge location display.
- Split into two segments with `flex` layout and `divide-x` separator.
- Responsive wrapping via `flex-wrap sm:flex-nowrap` for narrow viewports.

### Test Infrastructure

- Added Vitest configuration for `@cloudflared/web` and `@cloudflared/core`.
- Added comprehensive test suites:
  - `CloudflaredManager` core tests (287 lines) covering lifecycle, error handling, and edge cases.
  - `ConfigStore` core tests covering read/write/update and corrupt config recovery.
  - `tunnel.ts` utility tests covering formatting and comparison functions.
  - Log dialog behavior tests covering scroll, auto-follow, and preview logic.

## Changed

### Token & Settings Workflow

- Save/Discard buttons moved from the Token card to the Settings card, where the actual configuration fields live.
- Removed the now-redundant hint text "Changes are saved once you click Save Settings in the Token card."
- Token card now focuses purely on token management and auto-start.

### CSS and Theme Tokens

- Added `--color-chart-primary: oklch(0.546 0.245 262.881)` and `--color-chart-secondary: oklch(0.627 0.194 149.214)` to `@theme inline`.
- `PerformanceGraph` SVG strokes updated from `var(--color-primary, #3b82f6)` to `var(--color-chart-primary, #3b82f6)` and from `var(--color-emerald-500, #10b981)` to `var(--color-chart-secondary, #10b981)`.

### Keyboard Shortcut

- Log dialog shortcut changed from `Ctrl/Cmd+L` to `Ctrl/Cmd+Shift+L` to avoid the native browser address-bar shortcut on Windows/Linux.

### Log Dialog Animation

- Log preview animation changed from per-line `motion.div` wrappers with staggered delays to a single container-level `motion.div`.
- Reduces Motion animation nodes from N (one per visible line) to 1, improving rendering performance with large log volumes.

### Input Container Pattern

- Extracted the repeated nested border pattern (`rounded-xl > border > bg-muted/15 > p-1.5 > rounded-lg > bg-card > p-1`) into a reusable `InputContainer` component at `components/ui/input-container.tsx`.
- Replaced 4 instances across `TokenCard` and `SettingsCard` with the new component, reducing duplication.

### Server Actions

- Added `exportConfig`, `importConfig`, and `runDiagnostics` server actions.
- Config import includes `appConfigSchema` validation via zod before applying changes.
- Export serialises the full config or settings-only payload as formatted JSON.

### Ignore Files

- `.gitignore`: Added `.turbo/`, `.vscode/`, `.idea/`, `dist/`, `.claude/`.
- `.dockerignore`: Added `**/*.tsbuildinfo`, `**/coverage`, `**/out`, `scripts/`, project markdown/docs, config files not needed at runtime.
- `.prettierignore`: Added `.turbo/`, `coverage/`, `out/`, `build/`, `dist/`, `CHANGELOG.md`, `*.tsbuildinfo`, `next-env.d.ts`, `.env*`, `*.log*`.
- Removed empty `.npmignore` (all packages are `private: true`, so npm publish does not apply).

## Fixed

### Chart Color Variables

- Fixed `PerformanceGraph` connections path using `var(--color-primary)` which resolved to a neutral gray (the shadcn template default) instead of the intended blue.
- Fixed bandwidth path using `var(--color-emerald-500)` which was never defined in the theme and relied entirely on the fallback `#10b981`.
- Both paths now reference the new dedicated chart color tokens.

### Accessibility

- Added `aria-hidden="true"` to `PulseDot` container — the dot is purely decorative and tunnel status is already conveyed by adjacent heading and badge text.
- Version notification tooltip now includes `role="tooltip"`, a stable `id`, and `aria-describedby` on the trigger button for screen reader support.
- Tooltip `onBlur` handler changed from a 200ms timeout to an instant close for reliable keyboard navigation.

### Observability Card Grid Stability

- Traffic stat items (Ingress/Egress) changed from conditional DOM rendering (`{t.metrics && ...}`) to always-present elements.
- When metrics are unavailable, values display `"-"` with hint text "Enable metrics for live data".
- Prevents layout shifts when metrics data appears or disappears during polling.

### Hero Card Button DOM Stability

- Start/Stop tunnel buttons wrapped in a stable `<div className="relative inline-flex">` container.
- Previously, the ternary between `<Dialog>` (when online) and `<Button>` (when offline) caused the entire DOM subtree to restructure, potentially triggering layout jumps.

### ErrorBoundary Safe Reset

- "Try again" button now increments a `resetKey` state, and children are rendered inside `<div key={resetKey}>`.
- This forces React to unmount and remount the children tree, discarding any corrupted component state that would otherwise re-throw the same error immediately.

### SVG Aspect Ratio

- Added `h-auto` to the PerformanceGraph SVG element so the `viewBox` aspect ratio is respected across all viewport widths.

### ConnectorInfo Responsive Wrapping

- Added `flex-wrap sm:flex-nowrap` to the ConnectorInfo container, preventing the connector ID and edge location segments from colliding on viewports narrower than 360px.

## Container Image

Stable image:

```
ghcr.io/ptkelanatechsolutions/cloudflared:1.10.0
```

Latest image:

```
ghcr.io/ptkelanatechsolutions/cloudflared:latest
```

## Upgrade

Using Docker Compose:

```bash
docker compose pull
docker compose up -d
```

Or pull manually:

```bash
docker pull ghcr.io/ptkelanatechsolutions/cloudflared:1.10.0
```

## Supported Container Platforms

- `linux/amd64`
- `linux/arm64`
- `linux/arm/v7`

## Notes

- This release targets Linux containers.
- Windows and macOS are supported through Docker Desktop Linux containers.
- Native Windows containers are not supported.
- Native macOS containers are not supported.
- The Cloudflare Tunnel token is persisted in the `/config` directory.
- Keep the Web UI protected and avoid exposing it directly to the public internet without additional access control.
- The performance graph requires the metrics endpoint to be enabled in Settings.
- The diagnostics tool runs on-demand and does not poll in the background.

**Full Changelog**: https://github.com/ptkelanatechsolutions/Cloudflared/compare/1.9.0...1.10.0

## [1.9.0] 2026-06-23 [(20365c9)](https://github.com/ptkelanatechsolutions/Cloudflared/commit/20365c93f434768e84c6888978093f0eba062f96)

### Added

**Asymmetrical 2-Column Dashboard Layout**

- Restructured the dashboard from 4 stacked full-width cards to a responsive 2-column grid using `xl:grid-cols-12`.
- Hero card (7 columns) and Token card (5 columns) sit side by side on the top row.
- Settings card (7 columns) and Observability card (5 columns) sit side by side on the bottom row.
- Visual hierarchy now follows a natural left-to-right, top-to-bottom scan pattern.

**New Semantic Color Tokens**

- Added `--status-active` emerald green token (`oklch(0.527 0.154 171.94)`) for live/active status indicators.
- `PulseDot` now uses `--status-active` instead of `--primary` for clearer semantic meaning.

### Changed

**Card and Radius System**

- Unified all card radii: `PanelShell` uses `rounded-2xl` with `shadow-xs` (was `rounded-5xl` nested inside `rounded-4xl` with nested Card).
- Interactive elements (buttons, inputs, toggle groups) use `rounded-xl`/`rounded-lg`.
- Removed the outer `bg-muted/35` wrapper — cards now render directly as `bg-card` with `border-border/50`.
- All border opacities harmonized to `border-border/50` for a softer, cleaner separation.

**Navbar**

- Navbar starts transparent (`border-transparent bg-card/50`) and gains glass effect on scroll.
- Height reduced to `py-2` for a more compact presence.
- Border radius changed to `rounded-2xl`.
- Navbar is now constrained to `max-w-[88rem]` matching page content width.

**Label Styling**

- Standardised all label text across components: `text-[11px] font-medium tracking-wider text-muted-foreground uppercase`.
- Label icon gap unified to `gap-1.5`.
- Eyebrow component changed from wrapping `Badge` component to plain `span` for cleaner markup.

**Background and Page Layout**

- Replaced the previous heavy radial gradient with a subtle top gradient: `radial-gradient(primary 6% at 50% -20%)`.
- Added `bg-gradient-to-b from-background via-background to-muted/20` for a subtle depth transition.
- Container padding set to `px-4 pb-6` for consistent spacing.

**Button and Toggle Styles**

- All buttons changed from `rounded-full` to `rounded-xl` for a unified shape language.
- Toggle groups use `spacing={0}` with `rounded-lg` container and individual `rounded-md` items.
- Hero action buttons arranged in a compact `flex-wrap` row instead of full-width grid.

### Fixed

**Theme Toggle Hydration Mismatch**

- Fixed React hydration error caused by `next-themes` returning `theme = undefined` on the server.
- Replaced `useState` + `useEffect` pattern with `useSyncExternalStore` for SSR-safe mount detection.
- Server render now shows an inert placeholder with all buttons `disabled` and no `aria-checked`, matching the initial client render.
- Resolves ESLint `react-hooks/set-state-in-effect` warning in React 19.

### Documentation

- Updated `AGENTS.md` with `--status-active` token reference and shape convention guidance.
- Updated `apps/README.md` key files table to document `use-tunnel.ts`, `panel-shell.tsx`, `lib/tunnel.ts`, and `sections/` directory.
- Updated `README.md` project structure tree to show `components/sections/` and `components/ui/` subdirectories.

## [1.8.3] 2026-06-15 [(6a62e5d)](https://github.com/ptkelanatechsolutions/Cloudflared/commit/6a62e5dbf448990c4ec476f61945a980a874e72e)

### Fixed

**Error Handling & Feedback**

- Added toast notifications (`sonner`) for success/error feedback on all server actions (save token, toggle tunnel, restart, save settings, save and restart).
- ErrorBoundary now offers "Try again" (soft reset) and "Reload page" options, plus collapsible error details in development mode and a link to GitHub Issues.
- Added loading skeleton (`loading.tsx`) matching dashboard card layout to eliminate blank screen during server-side render.
- Added "Logs exported" toast confirmation after log file download.
- Added tooltip on disabled Save/Save & Restart buttons when metrics port validation fails.

**Accessibility**

- `aria-live` region (`data-status-region`) now dynamically updates with tunnel status changes for screen reader users.
- Overflow badge "+N more entries" changed from `<span>` to `<button>` for native keyboard accessibility.
- Log dialog header button relabeled from "Minimize" to "Close" for accurate action description.
- Touch targets increased: theme toggle (`size-7` → `size-9`), log dialog buttons (`h-7` → `h-9`), dialog close button (`icon-sm` → `size-9`).
- Stop tunnel now shows a confirmation dialog before stopping.

**Design Consistency**

- All hardcoded border radius values replaced with system tokens, with a new `--radius-5xl` token added to `globals.css`.
- Minimum label font size increased from 10-11px to 11-12px across all components.
- Added `font-heading` class to main heading in HeroCard.

**Performance & State Management**

- Polling interval reduced from 1000ms to 3000ms with `document.hidden` pause (no background polling).
- Immediate refresh on tab visibility change for up-to-date state.
- Added connection health detection: "Connection lost" banner appears after 4 consecutive polling failures (~12s).
- Log line stagger animation limited to first 5 lines to avoid cumulative delay.

**General**

- Added keyboard shortcuts: `Ctrl/Cmd+Enter` (toggle tunnel), `Ctrl/Cmd+L` (open log dialog).
- Date/time formatting now uses browser default locale instead of hardcoded `"en-US"`.
- Removed unused `ToggleField` component (dead code).

## [1.8.2] 20206-06-14 [(1e6289e)](https://github.com/ptkelanatechsolutions/Cloudflared/commit/1e6289ed9de5e04fd858db5c122720ed531f3046)

### Fixed

Added provenance flag to Docker build step

## [1.8.1] 20206-06-11 [(7f6f5a6)](https://github.com/ptkelanatechsolutions/Cloudflared/commit/7f6f5a6aae137c73bffa6acefbf9d8c2a279e03f)

### Fixed

**Web UI Accessibility**

- Added `ErrorBoundary` to protect the dashboard from full white-screen crashes.
- Added skip-to-content navigation.
- Added aria-live region for tunnel status announcements.
- Added `role="alert"` to error messages.
- Added `role="log"` to log preview containers.
- Added `aria-describedby` between the hero status heading and status subline.
- Added accessible label handling for mobile GitHub icon.
- Improved keyboard access for the version notification tooltip.
- Added fallback behavior for tooltip interaction.
- Added stable keys for log lines.

**Reduced Motion**

- Added reduced-motion guards for `PulseDot`.
- Added reduced-motion guard for the animated 404 SVG.
- This improves accessibility for users who prefer reduced motion.

**Core Security**

- Tunnel token is now passed through the spawned process environment instead of being passed as a `--token` CLI argument.
- This reduces token exposure risk in process argument listings.

**Runtime Reliability**

- Added 30-second spawn timeout to detect hung `cloudflared` launches.
- Added Windows `EINVAL` handling for stale child process kill attempts.
- Added `exitSignal` to tunnel status.
- Added buffering for partial log lines.
- `CLOUDFLARED_BIN` is now read at spawn time instead of module load time.

**Config Safety**

- Added atomic config writes using temp-file + rename.
- Added serialized `ConfigStore.update()` behavior through a promise chain.
- Added injectable `ConfigDir` support in `ConfigStore` constructor for better testability.

### Added

**Test Coverage**

- Added test suite for the core package.
- Added ConfigStore tests.
- Added CloudflaredManager tests.
- Added 17 tests covering config and tunnel manager behavior.

**Tooling**

- Added ESLint flat config for the core package.
- Root lint script now includes the core package.
- Added root test script.
- Updated TypeScript target from `ES2017` to `ES2022`.

**Changed**

- Improved Web UI resilience and accessibility semantics.
- Improved dashboard error visibility.
- Improved log rendering behavior.
- Improved core package maintainability and testability.
- Improved tunnel process safety and observability.

## [1.8.0] 20206-06-11 [(1f4eac8)](https://github.com/ptkelanatechsolutions/Cloudflared/commit/1f4eac884b0d3dd6f76d7989fd75a882250fc228)

### Added

**Scroll-Aware Navbar**

- Added scroll detection to the Navbar.
- Navbar glass effect now intensifies when the dashboard is scrolled.
- Navbar remains visible and polished as part of the main dashboard layout.
- The Navbar now shares the same max-width wrapper as the dashboard cards.

**Dashboard Structure**

- Split `tunnel-control.tsx` into:
  - `use-tunnel` hook
  - Hero card section
  - Settings card section
  - Token card section
  - Observability card section
  - Log dialog section

- Improved layout organization for the bento dashboard.
- Updated the page layout to use a shared `max-w-[88rem]` wrapper.
- Updated the main scroll container to use `h-dvh` for proper viewport-based scrolling.

### Changed

**Bento Grid Dashboard**

- Refined the bento dashboard layout.
- Improved card alignment and page spacing.
- Consolidated tunnel settings into a cleaner `SettingsCard`.
- Merged Protocol, Region, Edge IP, and Metrics port controls into one settings section.
- Improved visual consistency across status, settings, token, and observability sections.

**Navbar**

- Updated the Navbar to respond to scroll position.
- Improved glass styling, border intensity, shadow, and background opacity based on scroll state.
- Kept the Navbar visually attached to the dashboard experience without hiding it during scroll.

**Dialog Accessibility**

- Replaced the broken `asChild` DialogTitle pattern.
- Added an `sr-only` DialogTitle for accessible dialog labeling.
- Removed duplicate log dialog close button by relying on the intended dialog close behavior.

### Fixed

**Live Log Dialog**

- Fixed auto-scroll by querying the actual ScrollArea viewport element instead of calling `scrollTo` on the ScrollArea root.
- Fixed compact preview behavior so it shows the first 10 log lines.
- Fixed remaining log count badge so it correctly shows how many log entries are hidden.
- Fixed double-scroll behavior by removing extra `overflow-y-auto` from the ScrollArea wrapper.
- Fixed height conflict by removing the arbitrary `max-h-[55vh]` from the dialog ScrollArea.
- Added `followLogs` state with scroll detection so the log viewer can better respect user scroll position.
- Restored the missing Export Logs button in the dialog header.
- Fixed AnimatePresence exit behavior by adding the missing key.
- Replaced `Label` with `span` where no `htmlFor` target is available.

## [1.7.0] 20206-06-10 [(e3551f)](https://github.com/ptkelanatechsolutions/Cloudflared/commit/e3551f0d21de0b0bba86b08e3a40fe294be90388)

### Added

**Bento Grid Layout**

The dashboard now uses a responsive asymmetric bento grid layout across breakpoints:

- `xl`: 12-column layout.
- `md`: 4-column layout.

The new layout includes:

- Hero card — tunnel status, runtime chips, operational posture, Start, Stop, and Restart controls.
- Protocol mini card — compact toggle for Auto, HTTP2, and QUIC.
- Region mini card — compact toggle for Auto and US.
- Edge IP + Metrics card — stacked Edge IP toggle and Metrics switch.
- Token + Auto-start card — token input, auto-start toggle, and Discard + Save / Save & Restart action bar.
- Metrics port card — standalone port number input with validation.
- Observability card — runtime stats, error banner, and live session logs.

**Live Session Logs Dialog**

- Added shadcn Dialog component for expanded logs.
- Added full-screen live session logs view.
- Added Maximize2 opener from the inline log preview.
- Added Minimize2 close action in the expanded dialog.
- Added Export action for logs.

**Inline Log Preview**

- Inline logs are now capped to 10 lines.
- Compact log preview uses a constrained scroll area with max height.
- Added `+N more` badge when logs exceed 10 lines.
- This keeps the dashboard compact while still making longer logs accessible.

**Tooling**

- Added `scripts/version.js`.
- The script syncs `@cloudflared/web` and `@cloudflared/core` package versions from the root `package.json`.

### Changed

**Dashboard Layout**

- Restructured the dashboard into an asymmetric bento grid.
- Settings are now grouped into smaller, more focused cards.
- Token and Auto-start controls now have their own dedicated card.
- Metrics port is now separated into a standalone card for clearer validation and control.

**UI Cleanup**

- Removed decorative static icons from Save and Save & Restart buttons.
- Removed right arrow circles from Save and Save & Restart buttons.
- Loading spinner is now shown only when the action is busy.
- Removed unused `ToggleField` import.
- Removed unused `Settings2` import.

**Documentation and Versioning**

- Reformatted AGENTS.md line wrapping.
- Pinned `@cloudflared/web` version to `1.6.0`.
- Pinned `@cloudflared/core` version to `1.6.0`.

## [1.6.0] 20206-06-10 [(7c39d99)](https://github.com/ptkelanatechsolutions/Cloudflared/commit/7c39d999f73de356db176ee366b4e56e075b467e)

### Added

**Multi-Panel Tunnel Control**

The dashboard now uses a complete 3-panel tunnel control layout:

- Panel 1 — Status, Runtime, Start, Stop, and Restart controls.
- Panel 2 — Settings cards for Protocol, Region, Edge IP, and Metrics.
- Panel 3 — Observability panel with a scrollable live log viewer.

Panel 1 now supports a draft-aware `Save & Restart` button, allowing staged settings changes to be applied and restarted with a single action.

**raceful Restart**

- Added `CloudflaredManager.restart()`.
- Restart now gracefully stops the active child process.
- After stop completes, the tunnel automatically starts again using the same token and settings.
- Added `restartTunnel()` server action.
- Added `saveSettingsAndRestart()` server action.
- Settings changes can now be staged locally before being applied.

**Live Log Viewer**

- Added `DashboardState.logs`.
- cloudflared output is now streamed to the client.
- Added scrollable log viewer in the Observability panel.
- Added auto-scroll behavior with follow-threshold logic.
- Added copy-to-clipboard support for logs.

**UI Components**

Refactored `tunnel-control.tsx` into focused components:

- `panel-shell`
- `eyebrow`
- `pulse-dot`
- `runtime-chip`
- `runtime-field`
- `toggle-field`
- `switch-field`

Added shadcn/ui primitives:

- `Badge`
- `Card`
- `Label`
- `ScrollArea`
- `Separator`
- `Switch`
- `Toggle`
- `ToggleGroup`

### Changed

**Dashboard UI**

- Redesigned tunnel control into a clearer multi-panel layout.
- Improved runtime status presentation.
- Improved settings card organization.
- Added live draft indicators for staged settings changes.
- Improved visual hierarchy across status, settings, and observability sections.

**Code Quality**

- Extracted tunnel control logic into smaller components.
- Added shared tunnel UI helpers through `lib/tunnel.ts`.
- Updated components to use semantic CSS tokens from `globals.css`.

**CI & Docker**

- Split `container.yml` to publish per-architecture images.

- The workflow now publishes architecture-specific images in addition to the multi-arch manifest:
  - `amd64`
  - `arm64`
  - `armv7`

- Pinned default `CLOUDFLARED_VERSION` to:

  2026.6.0

- This improves reproducibility for container builds.

**Styling**

- Added semantic update color token:

  --color-update

- Added semantic success color token:

  --color-success

- The update notification state now uses orange.

- Success/runtime healthy states can now use the green success token.

### Fixed

**Hydration**

- Fixed React hydration error `#418` caused by `Intl.DateTimeFormat` locale mismatch.
- Fixed ThemeToggle `aria-checked` hydration mismatch by adding a mount guard.
- Added mount-aware placeholder behavior to ThemeToggle.

**Layout**

- Fixed CTA button icon clipping at rounded-full borders.

- Updated button layout with:

  w-full justify-between px-3

- Fixed medium breakpoint grid rows.

- Panel 3 now receives explicit `1fr` height instead of relying on implicit `auto` sizing.

- Observability panel now has more reliable scrollable height behavior.

**Date Formatting**

- Fixed `Intl.DateTimeFormat` locale to:

  en-US

- This keeps date formatting consistent between server and client.

## [1.5.1] 20206-06-10 [(3a74a7a)](https://github.com/ptkelanatechsolutions/Cloudflared/commit/3a74a7aa24bec99f4572911a727c3b9b61eb0f21)

### Fixed

**Auto-Start Guard**

- Fixed the `NEXT_RUNTIME` guard used by instrumentation auto-start.

- Changed the guard from:

  NEXT_RUNTIME !== "nodejs"

  to:

  NEXT_RUNTIME === "edge"

- In Next.js standalone production server, `NEXT_RUNTIME` may be undefined.

- The previous guard caused auto-start to silently skip after container restart.

- The new guard only skips auto-start in Edge runtime, allowing standalone Node.js production builds to run auto-start correctly.

**Startup Error Visibility**

- Added structured `[cloudflared]` logging for auto-start decisions.
- Auto-start boot decisions are now visible in container logs.
- Auto-start errors are now easier to diagnose from `docker compose logs`.

**Import Error Handling**

- Moved the dynamic import inside the `try` block.
- Import failures are now reported properly instead of failing silently.

## [1.5.0] 20206-06-10 [(4dc96a2)](https://github.com/ptkelanatechsolutions/Cloudflared/commit/4dc96a24b6ee4f2f49943e4fe9eca12285da2830)

### Added

**Animated 404 Page**

- Unknown routes now render a custom Cloudflared 404 page.
- Added a branded tunnel-visual SVG using concentric ellipses.
- Added gentle wobble animation to the tunnel illustration.
- Added a blur-in animation for the `404` heading.
- Added a clear `Back to Dashboard` link so users can quickly return to the main dashboard.

### Changed

- Replaced the default Next.js 404 behavior with a custom branded error page.
- Improved the user experience when navigating to invalid or missing routes.
- Made error navigation feel more consistent with the Cloudflared dashboard UI.

## [1.4.0] 20206-06-10 [(8c57ab7)](https://github.com/ptkelanatechsolutions/Cloudflared/commit/8c57ab761c03104896e7a0e6340f5b2d5a00acd3)

### Added

**Build-Time Version Injection**

- The UI version is now baked in at build time through `NEXT_PUBLIC_APP_VERSION`.
- Docker builds now receive the application version through a build argument.
- CI passes the Git tag automatically during release builds.
- This removes hardcoded version constants that can drift out of sync with the actual release tag.

**Smarter Token Paste**

- Improved the tunnel token field paste behavior.
- When pasted text contains extra spaces or surrounding content, the UI now auto-extracts the last token after the final space.
- Users no longer need to manually clean copied tunnel token text before saving it.

**Orange Update Pulse Dot**

- The update available indicator now uses a semantic CSS token:

  --color-update

- The dot uses a warm orange color designed specifically for update notifications.

- This makes the update state visually distinct without making it feel like an error or danger state.

### Fixed

**Version Check**

- Fixed update checking that previously failed because the GHCR Container Registry API returned `401 Unauthorized`.
- Replaced GHCR tag lookup with the public GitHub Releases API.
- The client now correctly detects when a newer Cloudflared release is available.
- Update status in the Navbar now works more reliably for public releases.

### Changed

- Replaced hardcoded UI version constants with build-time version injection.
- Updated the version check source from GHCR tags to GitHub Releases.
- Improved tunnel token input behavior for messy pasted values.
- Updated the update notification color to use a semantic design token.

## [1.3.0] 20206-06-10 [(d2c2e31)](https://github.com/ptkelanatechsolutions/Cloudflared/commit/d2c2e318248be015bfabd5aee26bad212b01cd3d)

### Added

**Version Notification in Navbar**

- Added a new version pill in the Navbar brand area showing the current container version, such as `v1.3.0`.
- On page load, the Web UI checks the GHCR Container Registry API for published tags.
- If a newer version is detected, an animated pulse dot appears next to the version pill.
- Hovering or clicking the version pill shows update details:
  - Latest available version.
  - Current version with strikethrough styling.
  - Direct link to the GitHub Release page.

- Added three tooltip states:
  - `Update available`
  - `Up to date`
  - `Check failed`

- Added Retry button for failed version checks.

**UI Components**

- Added Navbar component.
- Added theme toggle component.
- Added shadcn Tooltip primitives:
  - `TooltipProvider`
  - `Tooltip`
  - `TooltipTrigger`
  - `TooltipContent`
  - Portal-based tooltip rendering

- Wired `TooltipProvider` into the root layout.

### Changed

- Enhanced the tunnel control UI.
- Improved dashboard layout and interaction quality.
- Improved config handling in `@cloudflared/core`.
- Improved project documentation for:
  - Agents
  - Applications
  - Docker setup

### Technical Details

- Added `checkVersion()` server action.

- `checkVersion()` fetches GHCR tags from:

  /v2/ptkelanatechsolutions/cloudflared/tags/list

- Added 10-second timeout for the version check request.

- SemVer tags are filtered before comparison.

- Tags are sorted descending to detect the latest published version.

- Current version is compared against `1.3.0`.

- All errors return a safe fallback with:

  hasUpdate: false

- `PulseDot` uses a Motion `span` with repeating keyframes:
  - scale: `[1, 1.7, 1]`
  - opacity: `[1, 0.6, 1]`
  - duration: `1.5s`

- Tooltip animation uses `AnimatePresence`.

- Tooltip entry and exit animate scale and opacity.

- Tooltip easing uses:

  cubic-bezier(0.32, 0.72, 0, 1)

- Tooltip close has a 200ms mouse-leave delay so users can move into interactive tooltip content.

## [1.2.0] 20206-06-10 [(31771af)](https://github.com/ptkelanatechsolutions/Cloudflared/commit/31771afda0596dbaacae9365c2750bd9857a86a0)

### Added

**Documentation for AI Agents**

- Add AGENTS.md as the root-level orientation file covering project
  architecture, repository map, tech stack, commands, conventions, and
  hard-won lessons for multi-arch Docker builds.
- Add per-directory README files for apps/, packages/, and docker/ with
  key file tables, rules, and commands for each directory.

**New Web UI Components**

- **Navbar**: a floating glass-morphism pill at the top of the dashboard
  showing the Cloudflare brandmark, application name, a Repository link
  with GitHub icon, and a theme switcher. Entry is animated with a
  translateY + opacity + blur transition.
- **Theme Toggle**: a segmented control with Light, System, and Dark
  options. The active pill animates between positions via a shared Framer
  Motion layoutId with spring physics. Defaults to system theme.
- **Brand Icons**: GithubIcon and CloudflareIcon SVG components. The
  CloudflareIcon uses the official brand colors and is intentionally
  theme-independent.

**UI Changes**

- Integrate Navbar into the main page layout, shifting the tunnel control
  card into a flex-1 centered container below the navbar.
- Replace the generic Cloud icon in the tunnel card header with the full
  Cloudflare wordmark icon, removing the primary-colored background
  wrapper for a cleaner appearance.

### Fixed

- **CloudflaredManager restart guard**: prevent spawning a new cloudflared
  process while the previous process is still shutting down by checking
  the child process reference in addition to the running state.
- **Metrics flag ordering**: move --metrics before the "tunnel run"
  subcommand. As a top-level cloudflared flag, it was silently ignored
  when placed after the subcommand.
- **ConfigStore resilience**: properly separate file-not-found errors
  (return defaults) from genuine I/O errors (rethrow). Catch corrupt JSON
  and schema validation failures, falling back to defaults so the UI
  always boots.

## [1.1.5] 20206-06-10 [(440cd97)](https://github.com/ptkelanatechsolutions/Cloudflared/commit/440cd9784ca4816d15dc7d1c8757d14c82022df8)

### Fixed

**Multi-architecture container build**
The cloudflared downloader resolved the wrong target architecture because the predefined platform build args weredeclared with defaults, which shadow buildkit's per-target values. Declaring them without defaults restores correct per-arch resolution, so `linux/amd64`, `linux/arm64`, and `linux/arm/v7` images now build and publish.

## [1.1.4] 20206-06-10 [(8fb57f0)](https://github.com/ptkelanatechsolutions/Cloudflared/commit/8fb57f0f38d219808e70d1435f71c95480510bcb)

### Fixed

**Multi-architecture container build.** The cloudflared downloader stage was pinned to the build platform while reading per-target build args, which buildkit cross-contaminated (the `amd64` target received an ARM `v7` variant), aborting the build. Build-platform pinning was moved to the Next.js build stage, so the image now builds and publishes cleanly for every target.

## [1.1.3] 20206-06-09 [(c3ecd9f)](https://github.com/ptkelanatechsolutions/Cloudflared/commit/c3ecd9f1e4cd2b59f013bdd04b169eaa54364821)

### Fixed

- Fixed Docker build failure caused by copying `/cloudflared` from the downloader stage when the `.deb` install flow did not create that file.
- Fixed unreliable `cloudflared` installation behavior during multi-platform Buildx builds.
- Fixed ARM image build reliability by downloading architecture-specific binaries directly.

### Changed

- Replaced `.deb` package installation with direct binary download.
- Added architecture-specific binary mapping:
  - `linux/amd64` → `cloudflared-linux-amd64`
  - `linux/arm64` → `cloudflared-linux-arm64`
  - `linux/arm/v7` → `cloudflared-linux-armhf`
- Added `ca-certificates` to the runtime image.
- Ensured `/usr/local/bin/cloudflared` is executable in the final image.

## [1.1.2] 20206-06-09 [(260550b)](https://github.com/ptkelanatechsolutions/Cloudflared/commit/260550b1f55575632b2ef60983d5dc7a7c8cf9b0)

### Fixed

- Fixed possible Buildx failure when validating `cloudflared --version` during ARM cross-builds.
- Improved Dockerfile compatibility with QEMU-based multi-platform builds.

### Changed

- Replaced runtime binary execution check with a safer file validation check during build.
- The Docker build now validates that `/usr/local/bin/cloudflared` exists and is not empty.

## [1.1.1] 20206-06-09 [(be62ba5)](https://github.com/ptkelanatechsolutions/Cloudflared/commit/be62ba52803e3e55b3adbdfab18ab1d13bdacedd)

### Fixed

**Container Build**

- Fixed Buildx failure during the `cloudflared` installation step.
- Fixed unreliable `.deb` installation flow for multi-platform Docker builds.
- Improved architecture-specific binary selection for:
  - `linux/amd64`
  - `linux/arm64`
  - `linux/arm/v7`

### Changed

**Docker Image**

The Dockerfile now downloads the direct `cloudflared` binary for each target platform:

| Platform       | Binary                    |
| -------------- | ------------------------- |
| `linux/amd64`  | `cloudflared-linux-amd64` |
| `linux/arm64`  | `cloudflared-linux-arm64` |
| `linux/arm/v7` | `cloudflared-linux-armhf` |

This avoids Debian package installation issues during cross-platform builds.

## [1.1.0] 20206-06-09 [(9519b07)](https://github.com/ptkelanatechsolutions/Cloudflared/commit/9519b079cee05242475b947c39e0ceb4de5c842f)

### Added

**Multi-Architecture Container Support**

The official container image now supports:

| Platform       | Notes                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------- |
| `linux/amd64`  | Intel/AMD 64-bit servers, VPS, mini PCs, and common home servers.                                   |
| `linux/arm64`  | ARM64 servers, Raspberry Pi 4/5 64-bit, ARM VPS, and Apple Silicon Docker Desktop Linux containers. |
| `linux/arm/v7` | 32-bit ARMv7 devices such as Raspberry Pi OS 32-bit.                                                |

**Container Build Improvements**

- Added multi-platform Docker Buildx support.
- Added QEMU-based ARM build support in the container workflow.
- Improved architecture detection using BuildKit target platform arguments.
- Added clearer Cloudflared package mapping for each supported Linux architecture.

### Changed

- Updated the Cloudflared installation process inside the Docker image.
- Improved Dockerfile reliability for multi-architecture builds.
- Updated the GitHub Container Registry release workflow for broader Linux platform support.

## [1.0.0] 20206-06-09 [(36d1f74)](https://github.com/ptkelanatechsolutions/Cloudflared/commit/36d1f7469ce69c83986e9bae89122aeb2c025dae)

Initial stable release of **Cloudflared**, a self-hosted Web UI for managing Cloudflare Tunnel on a home server via Docker.

This release introduces the first production-ready version of the dashboard, focused on simple deployment, persistent configuration, and container-based operation for trusted home server environments.

### Highlights

- Initial stable release of the Cloudflared Web UI.
- Docker-first deployment for home servers.
- Default Web UI port: `23899`.
- Persistent config storage through `/config`.
- Token-based tunnel start workflow.
- Start and stop tunnel from the dashboard.
- Auto-start support when a token is saved.
- Production Next.js standalone build.
- Built-in `cloudflared` binary inside the container image.
- GitHub Container Registry publishing support.
- MIT licensed project.

### Added

**Web UI**

- Added a self-hosted tunnel control dashboard.
- Added tunnel status display.
- Added token save/replace workflow.
- Added start and stop tunnel actions.
- Added polling-based status refresh.
- Added configurable tunnel settings.

**Tunnel Runtime**

- Added `cloudflared tunnel run` process management.
- Added support for protocol options:
  - `auto`
  - `http2`
  - `quic`

- Added region configuration:
  - `auto`
  - `us`

- Added optional metrics support.
- Added persistent application config through `/config/config.json`.

**Docker**

- Added Dockerfile for the Web UI runtime.
- Added Docker Compose support.
- Added production image build based on Next.js standalone output.
- Added `WEBUI_PORT`, `WEBUI_HOST`, and `CONFIG_DIR` runtime variables.
- Added default Web UI port `23899`.
- Added healthcheck for the Web UI.
- Added support for installing a pinned or latest `cloudflared` binary during image build.

**CI/CD**

- Added Code Quality workflow for:
  - Prettier
  - ESLint
  - TypeScript type checking

- Added Container workflow for publishing image tags to GitHub Container Registry.
- Added SemVer tag support without `v` prefix.
