# Transmission Control App

A desktop control panel for live broadcasts. It docks to the right edge of your primary display and gives you one place to drive **PTZ cameras (ONVIF)** and **OBS Studio (OBS WebSocket)** — with the two wired together so a single click moves a camera *and* swaps the OBS scene.

Built with Electron, React 19, TypeScript and Tailwind. UI language is Portuguese (pt-BR).

## Features

- **PTZ control over ONVIF** — connect to multiple PTZ cameras, list their presets, and recall them with one click. Presets can be hidden, renamed (local alias), and tagged with a preview thumbnail.
- **OBS scene switching** — preview / program scene swaps, live reflection of OBS-side changes (program, preview, scene list).
- **PTZ ↔ OBS integration** — recalling a preset can automatically:
  - swap Program to an auxiliary scene to mask the camera moving,
  - move the camera,
  - wait for the configured transition time,
  - then push the camera's scene back to Program.
- **Preset thumbnails** — captures a screenshot from OBS after moving the camera and stores it as a tooltip preview for the preset, cached on disk.
- **Preset position cache** — remembers where the camera physically ended up for each preset, so the UI can highlight which preset matches the current pan/tilt/zoom.
- **Per-user config sync via Firebase** — sign in with email/password; camera and OBS configurations sync to Firestore and follow you across machines.
- **Config history with one-click restore** — every config save writes an immutable version to Firestore. The history screen lets you preview the diff between any past version and the current state, then restore — which itself is recorded as a new entry, so the timeline only ever moves forward.
- **Export / import config as JSON** — every history entry can be downloaded as a versioned JSON file (offline backup). Importing a file shows a diff preview and creates a new history entry on confirm.
- **Name your versions** — give any history entry a human label ("Pre-show 2026-05-04"). Names live in a separate mutable Firestore collection so the underlying snapshot stays tamper-proof.
- **Mock PTZ mode** for development without real hardware (`PTZ_CAM_DEV=true`).

## Tech stack

- Electron 38, electron-vite, electron-builder
- React 19 + TypeScript
- Tailwind v4, Radix UI primitives, lucide-react
- Zustand (client state) + TanStack Query (async state)
- react-hook-form + Zod (forms / validation)
- Firebase Auth + Firestore
- `onvif` (PTZ), `obs-websocket-js` (OBS)

## Project layout

```
src/
  main/        Electron main process — window, IPC, ONVIF camera driver, image cache
  preload/     contextBridge surface (window.ptz, window.clipboard, window.imageCache)
  renderer/    React app — routes, hooks, components, Zod schemas
```

See [AGENTS.md](AGENTS.md) for an in-depth architecture and conventions guide.

## Setup

Requires Node.js 20+ and npm.

```bash
npm install
```

Create `.env.development.local` with your Firebase project credentials:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

## Development

```bash
npm run dev
```

This starts electron-vite with `PTZ_CAM_DEV=true`, which swaps the real ONVIF driver for a mock that exposes 30 fake presets. Use it to work on the renderer without needing physical cameras.

Other scripts:

```bash
npm run typecheck   # tsc on node + web configs
npm run lint        # eslint
npm run format      # prettier
```

## Build

```bash
npm run build:mac     # .dmg
npm run build:win     # portable .exe
npm run build:linux   # AppImage / snap / deb
```

`electron-builder` configuration is in [electron-builder.yml](electron-builder.yml).

## Configuration model

The user config is a single Firestore document at `configs/<uid>` with this shape:

```ts
{
  obsConfig: {
    ip: string
    port: string
    password: string
    ignoreSceneList?: string[]
  } | null,
  cameraPTZConfig: Record<string, {
    id: string
    name: string
    user: string
    ip: string
    port: string
    password: string
    sceneId?: string | null         // OBS scene this camera maps to
    axSceneId?: string | null       // auxiliary scene used to mask transitions
    transitionTime?: number | null  // ms to wait for camera to settle
    presetLimit?: number | null
    positionRefreshTime?: boolean | null
  }>
}
```

Local-only state (hidden presets, cached preset positions, aliases) is kept in `localStorage`.

Every save also appends an immutable snapshot to `configs_history/<uid>/versions/<autoId>`:

```ts
{
  createdAt: Timestamp                     // serverTimestamp()
  config: { obsConfig, cameraPTZConfig }   // full snapshot
  restoredFromId?: string                  // present when this entry came from a restore
  restoredFromCreatedAt?: Timestamp
}
```

User-provided names for versions live in a separate, mutable doc at `configs_history_names/<uid>`:

```ts
{ [versionId]: "Pre-show 2026-05-04", ... }
```

Apply these Firestore security rules to keep the history truly write-once while still allowing names to be edited:

```
match /configs_history/{uid}/versions/{versionId} {
  allow read:   if request.auth != null && request.auth.uid == uid;
  allow create: if request.auth != null && request.auth.uid == uid;
  allow update, delete: if false;
}

match /configs_history_names/{uid} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

## Project status

Personal project, in active development. There is no automated test suite; verification is manual. The `Overlayers` feature is scaffolded but not yet enabled.

## License

No license specified. All rights reserved by the author.
