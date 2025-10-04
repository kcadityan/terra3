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
