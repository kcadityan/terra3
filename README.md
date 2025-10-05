# terra3

3rd version attempt of the terra project.

## Prerequisites

- Node.js 18 (or newer) and npm.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. (Optional) run the unit tests:
   ```bash
   npm test
   ```

## Running the sample kernel script

```bash
npm run dev
```

## Running the Colyseus world server

```bash
npm run server
```

- The server listens on port `2567` by default. Override it with:
  ```bash
  PORT=3000 npm run server
  ```
- If you see `EADDRINUSE`, another process already uses the port. Stop the other server (for example with `lsof -i :2567` followed by `kill <pid>`) or choose a new port via `PORT=...`.

Once running, the server exposes the `world` room which publishes a 10x10 empty world grid over Colyseus. The client-side world module connects with `WorldClient` (protocol-only) or `createWorldGame` (Phaser renderer).

### Terrain mods and world plan

- Terrain materials (air, grass, dirt, stone, gold) live under `mods/terrain/**` and register their own textures/metadata with the shared registry.
- The world module only stitches together a layout supplied by `engine/world/plan/defaultPlan.ts`. Replace that plan (or inject a new one) to change block counts and placement without modifying the mods themselves.
- Each terrain mod owns its assets in its `textures/` directory, so contributors can ship new looks or entirely new materials independently of world generation.

## Viewing the world grid in a browser

1. Start the Colyseus server (see above).
2. In a separate terminal run the Vite dev server:
   ```bash
   npm run client
   ```
3. Open `http://localhost:5173` in your browser. You should see the 10x10 grid rendered via Phaser.

Environment tweaks:

- Change the world server host/port by exporting `VITE_WORLD_HOST`, `VITE_WORLD_PORT` (defaults: current hostname, `2567`).
- Set `VITE_WORLD_SECURE=true` when serving the Colyseus server over TLS to force `wss`.
- Movement controls (client): `←`/`A` and `→`/`D`; jump with `↑`/`W`/Space.

### Player module

- `mods/player/**` owns multiplayer player state. The server composes a per-room player manager that spawns each client on the surface, applies movement intents, and rebroadcasts jump states through Colyseus.
- `WorldClient` exposes `move(-1|1)` and `jump()` helpers so UIs can publish intents without depending directly on Colyseus APIs.
