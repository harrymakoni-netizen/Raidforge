# RAIDFORGE

**Chat builds the boss. You survive it.** A playable 2D boss arena with community-proposed attacks, Codex-generated attack programs, and monsters that travel between participating Twitch channels.

## Run it

Requires Node.js 22+, npm, and a modern browser.

```bash
npm ci
npm start
```

Open http://localhost:3000. Practice mode works without credentials: select a mutation, inspect and preview it, equip it, and fight the Honkfather. The browser saves progress locally. Practice handoffs are labeled rehearsals and never initiate Twitch raids.

Controls: WASD or arrows to move, hold Space to shoot toward the boss, mouse + hold click to aim manually, Shift to dash, Escape to pause. Touch: drag to move and auto-fire; use the Dash button. Sound is opt-in.

## Enable the live service

1. Copy `.env.example` to `.env` (ignored by Git).
2. Set `RAIDFORGE_ADMIN_TOKEN` to a random token of at least 24 characters. Generate one with `openssl rand -hex 32` and keep it private.
3. Register a Twitch application at https://dev.twitch.tv/console/apps. Set `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`. Set its OAuth redirect URI to `<PUBLIC_URL>/auth/twitch/callback`.
4. Install/authenticate Codex on the service host (`codex login`), or set `CODEX_API_KEY`. The pinned SDK includes a Codex CLI runtime. The default Codex model is used unless `CODEX_MODEL` is set.
5. Set `PUBLIC_URL` to your service origin. For remote use, put the Node service behind HTTPS. Set `ALLOWED_ORIGINS` to a comma-separated list including your frontend origin.
6. Restart `npm start`. In **Connect Twitch**, enter the service URL, admin token, and channel login. Click **Connect service**, then **Authorize Twitch**, signing in as the exact channel selected.
7. Return to the workshop and reconnect the service. Twitch access tokens live only in service memory; authorize again after a server restart. The admin token stays only in the browser tab’s memory.

The hosted private Site serves the static practice app. The live Node companion is separate because the Codex SDK launches a local CLI process. A hosted HTTPS frontend requires an HTTPS companion URL. For local development, use http://localhost:3000 for both.

**Deployment model:** this is a single-owner service for your own participating test channels. The admin token grants control over every room on that service; do not give it to untrusted users or treat it as a multi-tenant product. A viewer needs no admin token to see the OBS room. Before broader release, add per-broadcaster sessions, persistent encrypted OAuth tokens, and production rate limiting.

### Twitch chat commands

- `!forge Make missed shots come back at the player` — proposes a mutation (30-second cooldown per viewer).
- `!vote 1` — votes for proposal #1. One vote per Twitch user per proposal, persisted across restarts.

The broadcaster chooses which proposal to forge. Codex receives the proposal as untrusted creative input, generates a bounded JSON attack program, and returns it for preview. Generation does not change the equipped boss. Only **Equip mutation** activates it; **Restore previous mutation** rolls back.

### OBS

Connect the live service, then click **Copy OBS overlay URL**. It looks like:

```text
https://your-service.example/?overlay=1&room=your_channel
```

Add it as a 1000 × 667 OBS browser source. Keep the main workshop tab open during the fight. It broadcasts arena frames to the spectator view. Controls remain in the main browser. The overlay is read-only and contains no admin credential.

### Actual raid handoff

1. Authorize both participating Twitch channels on the same service.
2. In the source channel’s workshop, choose **Prepare a raid**, enter the destination, and arm the handoff (valid for 30 minutes).
3. Initiate the actual `/raid destination` in Twitch. RAIDFORGE does not send a Twitch raid itself.
4. The destination’s EventSub connection receives `channel.raid`. The destination workshop gets an incoming boss invitation.
5. The receiving streamer accepts or declines. Acceptance copies the source boss, creator credit, and history and adds a real raid entry. Arrival alone never overwrites a boss.

## Attack language

`dist/program.js` defines the schema and validator. Programs can combine up to three ring, aimed, or spiral patterns; vary count, speed, spread, and cadence; condition attacks on player movement or the boss’s rage phase; mirror/chase the player; and recycle missed player shots. The interpreter caps projectiles at 240 and limits spawn rates.

Generated output is declarative JSON, **not arbitrary JavaScript**. There is no `eval`, generated module import, or network/file instruction in the attack language. Unsupported ideas are approximated within this language and should be described honestly in the generated tagline. Syntax and resource checks do not prove balance or dodgeability; preview before equipping.

The generator runs Codex in a temporary read-only workspace with shell tools disabled, web search and tool network access disabled, and an explicit filesystem deny policy outside that workspace. It passes an allowlist of runtime/auth/proxy environment variables, excluding Twitch and service-admin secrets. Run the live companion on a dedicated host with the pinned compatible SDK/CLI.

## Architecture

- `dist/`: buildless HTML/CSS/ES modules, Canvas arena, attack interpreter, local persistence, live service client.
- `server/index.js`: Express API, host authorization, WebSocket room updates and OBS frames.
- `server/twitch.js`: OAuth, EventSub WebSocket subscriptions/reconnect, chat commands, raid notifications, token refresh.
- `server/generate.js`: Codex SDK generation, output schema, limits, 180-second timeout.
- `server/store.js`: atomic JSON state persistence under `data/` (ignored), votes, mutation snapshots, raid acceptance.
- `.openai/hosting.json`: private Sites deployment of the static client.

Run one Node instance against the JSON store. For multiple replicas, move state and event delivery to a shared transactional database/pubsub service. Handoff arming and pending Codex previews are intentionally ephemeral; re-arm/re-forge after restarting.

## Verification

```bash
npm test
npm run check
```

`node test/browser-check.mjs` exercises the actual browser flow against a running service and saves screenshots in `artifacts/`. It expects a Chromium binary at `/usr/bin/chromium`; adapt the executable path for your machine.

Verified locally: attack bounds, one-vote enforcement, persistence, auth enforcement, generation/approval separation, cross-room generation rejection, raid acceptance, rollback, OBS frame relay, OAuth state rejection, desktop/mobile UI, keyboard fight/pause, and local handoff history.

**Not verified against live accounts:** Twitch OAuth/EventSub, real cross-channel raid, and authenticated Codex generation. No Twitch app credentials were provided. A real Codex SDK generation was attempted; the installed CLI reported a stale access token that could not be refreshed and requires sign-in again. The generation code reached authentication but a real output could not be verified. Automated tests inject a deterministic generator and controlled Twitch events, and do not claim those are live integrations.

## Hackathon submission

See `SUBMISSION.md` for the demo outline and remaining live recording steps. Keep your primary build-thread Codex session ID; retrieve it with `/status` in the build session. The runtime-generated attack session IDs are separate and do not replace the primary build session ID.

## Assets and dependencies

The goose, arena, and icon artwork are original Canvas/SVG drawings in this repository. Fonts are Barlow Condensed, DM Sans, and IBM Plex Mono (Google Fonts; their open font licenses apply). System fallbacks work if fonts cannot load. Third-party npm dependencies retain their own licenses. No third-party game assets or copyrighted music are included.
