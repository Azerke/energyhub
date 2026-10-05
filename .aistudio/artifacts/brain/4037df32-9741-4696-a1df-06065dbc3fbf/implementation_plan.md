# Energy Dashboard — Native PWA Install & Full-Screen Experience

Resolves Android Chrome's "Can't install this app" WebAPK failure so the Energy Dashboard installs as a true standalone app (hiding Chrome's address bar and navigation UI) and adds one-tap in-app Install and Full-Screen controls directly in the dashboard header.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following preferences were confirmed during planning and govern how the dashboard launches and fills the screen on mobile and desktop devices.

- **Confirmed Decision 1 — Standalone Display Mode**: The Web App Manifest and mobile meta tags will configure `display: "standalone"` (with `fullscreen` fallback support via the Fullscreen API), keeping the Android system status bar (battery, clock, Wi-Fi) visible while completely hiding Chrome's URL bar and tab switcher.
- **Confirmed Decision 2 — Header Install & Full-Screen Controls**: The top header bar will include both an interactive **Install App** button (triggering Chrome's `beforeinstallprompt` flow or guided instructions when already prompted) and a one-tap **Full Screen** toggle button (`requestFullscreen()` / `exitFullscreen()`) so the dashboard can immediately fill the screen even if opened from a Chrome shortcut or regular tab.

---

### 1. Overview & Core Concept

- **What It Does**: Upgrades the Energy Dashboard's Progressive Web App (PWA) packaging, icon assets, manifest credentialing, and viewport controls so Chrome on Android and desktop installs it as a standalone application and allows instant full-screen expansion at any time.
- **Target Audience / Persona**: Home energy monitoring user viewing live Victron / Node-RED solar, battery, grid, EV, boiler, and laundry telemetry on an Android phone or wall/desk display.
- **Key Value**: Eliminates browser chrome clutter so all energy cards (House/Grid, Solar, Battery, EV/Boiler/Laundry, and 6-Day Forecast) fit cleanly on the screen like a native Android app.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Direct In-App Installation**: When opening the dashboard in Chrome, the user sees an **Install** button in the top header. Tapping it triggers the native Chrome install prompt (`beforeinstallprompt`). Once installed and launched from the Android home screen in standalone mode, the Install button automatically hides.
  2. **One-Tap Full-Screen Expansion**: At any time (whether inside a browser tab, a Chrome home-screen shortcut, or standalone mode), tapping the **Full Screen** icon button in the header expands the dashboard to fill 100% of the screen using the browser Fullscreen API, hiding all browser toolbars. Tapping again exits full-screen mode.
  3. **Seamless Offline & Tailscale Live Polling**: The dashboard continues polling `https://einstein-victron.taile3356b.ts.net:1881/evdata` and `/solardata` every 5 seconds while bypassing service worker caching for live API calls, and falls back gracefully when offline.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Clean, high-contrast mobile utility dashboard optimized for rapid glanceability and one-handed thumb interaction.
  - *Color Palette & Mood*: Cool slate neutral canvas (`bg-slate-100`), crisp white and semantic tinted cards (`emerald` for live/charging, `amber` for solar, `rose` for active boiler, `blue` for active laundry, `indigo` for solar forecast).
  - *Typography & Hierarchy*: High-impact tabular numerals (`tabular-nums`) for wattage, kWh, and state-of-charge percentages so live updates never jitter horizontally.
  - *Component Styling & Layout*: Touch-friendly action buttons in the top header with minimum comfortable tap targets, compact single-line labels (`whitespace-nowrap`), and `rounded-3xl` card geometry that fits comfortably within a mobile viewport.
- **Interactive Feedback & Motion**: Smooth `active:scale-95` tactile card press states, animated battery charge/discharge pulse, and immediate icon state transitions between Enter Full Screen (`Maximize2`) and Exit Full Screen (`Minimize2`).

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Valid Opaque PNG & Maskable Icon Generation**
  - *Chosen Approach*: Generate valid, non-corrupt, full-bleed opaque 192×192, 512×512 (`purpose: "any"`), 512×512 maskable (`purpose: "maskable"` with safe-zone padding), and 180×180 Apple touch PNG icons with proper CRC32 checksums and zlib-compressed pixel data depicting the energy lightning emblem on an emerald background.
  - *Why*: Android Chrome's WebAPK minting server downloads and decodes the 192×192 and 512×512 PNGs listed in the manifest. Blank, 1×1, or corrupted PNG streams cause WebAPK generation to fail with `"Can't install this app"` and fall back to a browser shortcut.
  - *Alternatives Considered*: Using SVG-only icons in the manifest. Rejected because Android WebAPK and iOS Safari strictly require raster PNG icons at 192px and 512px.
- **Decision 2: Credentialed Manifest Fetching & Unified Service Worker**
  - *Chosen Approach*: Add `crossorigin="use-credentials"` to `<link rel="manifest">` and configure `vite-plugin-pwa` with a complete manifest (`id: "/"`, `start_url: "/"`, `scope: "/"`, `display: "standalone"`, `description`) and `devOptions: { enabled: true }`, removing conflicting manual service worker stubs.
  - *Why*: Cloud Run / AI Studio shared preview links use session cookies for forwarding. Without `crossorigin="use-credentials"`, Chrome fetches `manifest.json` anonymously, receives a redirect HTML page instead of JSON, and aborts installation with `"Can't install this app"`.
- **Decision 3: Dual Standalone PWA + Fullscreen API Toggle**
  - *Chosen Approach*: Combine compliant `standalone` PWA installation with an explicit Fullscreen API button in the header.
  - *Why*: Gives the user a permanent native-like home screen app when installed, while also guaranteeing a 1-tap full-screen view even if opened from an existing Chrome shortcut.

---

### 4. Technical Architecture & Data Strategy

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Android Chrome / Standalone WebAPK                  │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Web App Manifest (crossorigin="use-credentials", display:standalone)│
│  │  • 192x192 PNG (any)  • 512x512 PNG (any)  • 512x512 PNG (maskable)│
│  └───────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Energy Dashboard SPA                            │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Top Header Bar                                                    │  │
│  │  • Brand Title ("Energy" -> opens /evdata)                        │  │
│  │  • PWA Install Button (beforeinstallprompt + standalone detection)│  │
│  │  • Full-Screen Toggle Button (document.fullscreenElement API)     │  │
│  │  • Live / Offline Status Indicator                                │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│                                    ▼                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Live Telemetry Grid & Detail Modal                                │  │
│  │  • House & Grid Card (/dashboard/page1)   • Solar & Yield Card    │  │
│  │  • Animated Battery SOC & Power Card      • EV / Boiler / Laundry │  │
│  │  • Today & 6-Day Solar Forecast Cards     • Section Detail Modal  │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │ 5s Polling (cache: 'no-store')
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│          Victron / Node-RED API (einstein-victron.taile3356b.ts.net)    │
│                 GET :1881/evdata   &   GET :1881/solardata              │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - `evData` & `solarData`: Live JSON payloads polled every 5 seconds from `https://einstein-victron.taile3356b.ts.net:1881/evdata` and `/solardata`, with automatic fallback to cached/offline sample telemetry if unreachable.
  - `deferredPrompt` & `isInstalled`: Tracks browser `beforeinstallprompt` event, `appinstalled` event, and `window.matchMedia('(display-mode: standalone)')` state.
  - `isFullscreen`: Reactive boolean tracking `document.fullscreenElement` via `fullscreenchange` event listeners.
- **Interactive Component & State Mapping**:
  - **Install Button**: Calls `deferredPrompt.prompt()` when available; if Chrome has not yet fired `beforeinstallprompt` (or on browsers requiring manual menu selection), opens a concise install helper modal explaining how to refresh and install after updating the shared link. Automatically hides when `isInstalled` is true.
  - **Full-Screen Toggle Button**: Calls `document.documentElement.requestFullscreen()` when not in full screen, and `document.exitFullscreen()` when active, updating the button icon and state immediately.
  - **Service Worker & Cache Strategy**: Precaches app shell assets (`index.html`, JS/CSS bundles, PNG/SVG icons) for instant offline startup while strictly excluding `:1881` API requests from interception.
