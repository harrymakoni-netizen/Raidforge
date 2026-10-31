# RAIDFORGE

**Chat builds the boss. You survive it.** A playable 2D boss arena with community-proposed attacks, Codex-generated attack programs, and monsters that travel between participating Twitch channels.

## Encounter II — a fight worth learning

Every forged boss now fights through three authored arena phases: **The Shakedown** (targeted floor strikes), **Crossfire** (aimed volleys and marked lanes at 70% health), and **Last Honk** (faster attacks and crossing lanes at 35%). These mechanics run alongside the community-generated attack program, including conditional attacks. The arena gets another pressure increase after 60 seconds.

Floor warnings lock their position before impact: 1.5 seconds on Chill, 1.15 on Standard, 0.9 on Nightmare. Phase changes clear existing threats and give 1.4 seconds to reposition. The visible white center marks the player hitbox. Dash moves in the last movement direction even after releasing movement, grants brief invulnerability, and preserves longer chat shields. Hold F for slower precision movement.

Close dodges charge **Overdrive**. Eight distinct feathers grazed without invulnerability earn four seconds of +65% shot damage; taking a hit removes 25% charge. Shields and dashes cannot farm charge. Reports record close dodges, Overdrive activations, phase reached, and advice based on the last hit.

Balance regression checks run the actual game loop: standing still and holding fire loses all four supplied programs on Standard and Nightmare; an input-only avoidance pilot clears them in roughly 36–44 and 46–51 seconds respectively. These are automated balance checks, not human playtest completion rates or a promise about every generated program.

Shared challenges now include arena rules version 2. Personal-best keys include the rules version, so old ten-second clears do not compete with new runs. Existing unversioned challenge links open under the current rules, stated in the acceptance dialog; unsupported explicit versions are rejected. Previous run records stay in the run book.

## Community features

- **Chat powers:** during an active fight, viewers type `!shield`, `!heal`, or `!fury`. Each 12-second round counts one vote per Twitch user; a new command changes that user's vote. At least one vote is needed. Ties favor shield, then heal, then fury. The winner grants three seconds of invulnerability, restores one heart, or speeds up enemy projectiles for five seconds. Votes are discarded when a fight pauses, ends, changes run, or loses its broadcaster connection. Practice mode offers clearly labeled local power controls with a 12-second cooldown.
- **Shareable boss challenges:** share a link containing the validated attack program, creator credit, difficulty, and power setting. Friends can accept the exact boss without an account. The payload stays in the URL fragment. Creator credit is supplied by the person sharing, not identity-verified.
- **Three difficulties:** Chill, Standard, and Nightmare adjust projectile speed, attack cadence, warning time, player damage, and dash cooldown. Settings lock during a fight.
- **Run book and scorecards:** completed runs record time, accuracy, health, damage, dashes, power activations, close dodges, Overdrive, phase reached, and creator credit. Download a PNG scorecard. Personal bests compare only wins against the same boss program, difficulty, power setting, and arena rules version. These are local-device or companion-workshop records, not a verified global leaderboard.

## Deployment

Live frontend: https://raidforge-five.vercel.app

GitHub source: https://github.com/harrymakoni-netizen/Raidforge (public).

`vercel.json` deploys `dist/` as a static frontend with no install or build step. The full Node companion stays in the repository and must run separately for live Twitch/Codex features. Configure that service’s `ALLOWED_ORIGINS` to include the deployed Vercel origin, then enter its HTTPS URL in **Connect Twitch**. This deployment does not supply Twitch credentials or repair Codex authentication.

## Run it

Requires Node.js 22+, npm, and a modern browser.

```bash
npm ci
npm start
```

Open http://localhost:3000. Practice mode works without credentials: select a mutation, inspect and preview it, equip it, and fight the Honkfather. The browser saves progress locally. Practice handoffs are labeled rehearsals and never initiate Twitch raids.

Controls: WASD or arrows to move, hold Space to shoot toward the boss, mouse + hold click to aim manually, Shift to dash in the last movement direction, F for precision movement, Escape to pause. Touch: drag to move and auto-fire; use the Dash button. Sound is opt-in.

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
- `!shield`, `!heal`, `!fury` — vote for the next live-fight power. The broadcaster must enable Chat powers before starting.

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

`dist/program.js` defines the schema and validator. Programs can combine up to three ring, aimed, or spiral patterns; vary count, speed, spread, and cadence; condition attacks on player movement or the boss’s rage phase; mirror/chase the player; and recycle missed player shots. The schema limits generated base spawn rates to 22 feathers/second; difficulty and phase modifiers can increase this at runtime. The interpreter caps concurrent projectiles at 240, including authored arena volleys. Floor hazards are authored circles/lanes, limited to two concurrent marks, and never execute generated code.

Generated output is declarative JSON, **not arbitrary JavaScript**. There is no `eval`, generated module import, or network/file instruction in the attack language. Unsupported ideas are approximated within this language and should be described honestly in the generated tagline. Syntax and resource checks do not prove balance or dodgeability; preview before equipping.

The generator runs Codex in a temporary read-only workspace with shell tools disabled, web search and tool network access disabled, and an explicit filesystem deny policy outside that workspace. It passes an allowlist of runtime/auth/proxy environment variables, excluding Twitch and service-admin secrets. Run the live companion on a dedicated host with the pinned compatible SDK/CLI.

## Architecture

- `dist/`: buildless HTML/CSS/ES modules, Canvas arena, attack interpreter, local persistence, live service client.
- `server/index.js`: Express API, host authorization, WebSocket room updates and OBS frames.
- `server/twitch.js`: OAuth, EventSub WebSocket subscriptions/reconnect, chat commands, raid notifications, token refresh.
- `server/generate.js`: Codex SDK generation, output schema, limits, 180-second timeout.
- `dist/challenges.js`: challenge-link validation, ruleset identity, run scoring and personal-best comparisons.
- `dist/combat.js`: versioned encounter rules, phase thresholds, locked floor warnings, and spectator-frame validation.
- `dist/feature-ui.js`: audience controls, challenge sharing, run book, and PNG scorecard export.
- `server/audience.js`: isolated voting rounds with unique-viewer votes, stale-connection checks, and power resolution.
- `server/store.js`: atomic JSON state persistence under `data/` (ignored), votes, mutation snapshots, raid acceptance.
- `.openai/hosting.json`: private Sites deployment of the static client.

Run one Node instance against the JSON store. For multiple replicas, move state and event delivery to a shared transactional database/pubsub service. Handoff arming and pending Codex previews are intentionally ephemeral; re-arm/re-forge after restarting.

## Verification

```bash
npm test
npm run check
```

`node test/touch-combat.mjs` checks actual touch movement, auto-fire, and the mobile dash button. `node test/combat-browser.mjs` checks a stationary loss, warning timing, pause, three-phase victory, retry advice, versioned records, and mobile HUD. `test/combat.test.js` covers active/passive balance, safe warnings, phase transitions, dash/shield interaction, grazing, Overdrive, and OBS hazard bounds. Browser combat pilots use a test-only module export and normal movement/fire/dash inputs; they do not change health, timing, damage, or game rules.

`node test/features-browser.mjs` checks challenge sharing/acceptance, a complete fight, scorecard downloads, run persistence, and power controls. `PUBLIC_URL=http://localhost:3002 node test/live-browser.mjs` tests the connected UI with a controlled generator.

`node test/browser-check.mjs` exercises the actual browser flow against a running service and saves screenshots in `artifacts/`. It expects a Chromium binary at `/usr/bin/chromium`; adapt the executable path for your machine.

Verified locally: challenge round trips and malformed-input rejection, unique power votes and deterministic ties, stale/paused/preview power rejection, actual command-handler-to-WebSocket power delivery, personal-best separation, score calculation, and attack bounds, one-vote enforcement, persistence, auth enforcement, generation/approval separation, cross-room generation rejection, raid acceptance, rollback, OBS frame relay, OAuth state rejection, desktop/mobile UI, keyboard fight/pause, and local handoff history.

**Not verified against live accounts:** Twitch OAuth/EventSub, real cross-channel raid, and authenticated Codex generation. No Twitch app credentials were provided. A real Codex SDK generation was attempted; the installed CLI reported a stale access token that could not be refreshed and requires sign-in again. The generation code reached authentication but a real output could not be verified. Automated tests inject a deterministic generator and controlled Twitch events, and do not claim those are live integrations.

## Hackathon submission

See `SUBMISSION.md` for the demo outline and remaining live recording steps. Keep your primary build-thread Codex session ID; retrieve it with `/status` in the build session. The runtime-generated attack session IDs are separate and do not replace the primary build session ID.

## Assets and dependencies

The goose, arena, and icon artwork are original Canvas/SVG drawings in this repository. Fonts are Barlow Condensed, DM Sans, and IBM Plex Mono (Google Fonts; their open font licenses apply). System fallbacks work if fonts cannot load. Third-party npm dependencies retain their own licenses. No third-party game assets or copyrighted music are included.
