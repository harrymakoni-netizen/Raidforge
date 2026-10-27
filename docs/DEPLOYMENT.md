# Deployment

## Targets

- GitHub: https://github.com/harrymakoni-netizen/Raidforge (public), branch `main`.
- Vercel: project `raidforge` in HJM Technologies (`hjm-technologies`).
- Output: `dist/`; no install or build step. See `vercel.json`.
- Live service: separate Node host. The static deployment supports practice mode and connecting to an HTTPS companion.

## Vercel configuration

Connect the GitHub repository to the Vercel project with the repository root as the root directory. `vercel.json` sets a static deployment, disables dependency installation and builds, and serves `dist/`. The Node server is included in GitHub for running the live companion, but is not deployed as a Vercel function.

For Twitch/Codex features, deploy the companion separately, configure Twitch app credentials and Codex authentication there, and include the Vercel frontend origin in the companion’s `ALLOWED_ORIGINS`. Enter its HTTPS URL in the frontend’s Connect Twitch dialog.

## Verification

- `npm test`: 8 passing tests.
- `npm run check`: JavaScript syntax checks passed.
- Desktop and mobile browser flows passed during implementation.

The previous private Sites deployment remains separate and unchanged.
