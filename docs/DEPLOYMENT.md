# Deployment handoff

The source is ready for GitHub and a static Vercel production deployment.

## Intended targets

- GitHub: `harrymakoni-netizen/raidforge`, private, branch `main`.
- Vercel: new project `raidforge` in the connected account's default team `hjm-technologies` (`team_OwOZUFfi6SCd85S400KEvvGz`).
- Output: `dist/`; no install or build step. See `vercel.json`.
- Live service: separate Node host. The static deployment supports practice mode and connecting to an HTTPS companion.

## Access blockers observed

- GitHub CLI `gh repo create ... --private` returned `Resource not accessible by integration (createRepository)`. The connected GitHub app cannot create repositories. Create an empty private repository and grant the connection access, then push the prepared source.
- Vercel returned `403 forbidden` for the default team, requiring the connection's team grant. Complete the Vercel consent link generated in chat; it is single-use and expires after 10 minutes.

## Checks completed

- `npm test`: 8 passing tests.
- `npm run check`: JavaScript syntax checks passed.

No GitHub repository or Vercel deployment has been created yet. The existing private Sites deployment is unchanged.
