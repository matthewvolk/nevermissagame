## Bun

- Use `bun` instead of `node`, `ts-node`, `npm`, `yarn`, `pnpm`, `npx`
- Use `bun test` to run tests (uses `bun:test`, not jest/vitest)
- Use `bun install` with `--frozen-lockfile` in CI
- Prefer `Bun.file()` over `node:fs` readFile/writeFile
- Bun auto-loads `.env` — don't use dotenv

## Project Overview

Never Miss a Game is a daily sports email digest. It fetches scores and schedules from the ESPN API, builds an HTML email, and sends it via Resend. There is no server — it runs as a script triggered by a GitHub Actions cron job.

## Entry Points

- `src/index.ts` — production entry point. Loads preferences, fetches data, builds email, sends via Resend.
- `src/preview.ts` — local development. Writes `preview.html` and opens it in the browser. Accepts `--date YYYY-MM-DD` to simulate a different day.

## Deployment

GitHub Actions cron (`.github/workflows/daily-email.yml`) runs daily at 11:00 UTC (6 AM ET). Also supports `workflow_dispatch` for manual runs.

## Key Modules

- `src/config.ts` — league definitions, constants (`LOOKAHEAD_DAYS`, retry/timeout settings)
- `src/espn/` — ESPN API client with exponential backoff, scoreboard fetching, event normalization
- `src/events/` — fetch yesterday's results and upcoming games (14-day window), apply filtering
- `src/email/` — HTML email template builder and Resend send logic
- `src/favorites/` — load `favorites.json`, reorder leagues, prioritize favorite teams, truncate
- `src/conferences/` — resolve ESPN group IDs for college sports conference filtering
- `src/utils/` — date helpers (all ET timezone), logger

## Data Flow

1. Load `UserPreferences` from `favorites.json`
2. Fetch yesterday's results and upcoming events in parallel
3. For each league: resolve conference groups → call ESPN scoreboard API → normalize events → filter by status → apply favorites (reorder, prioritize, truncate)
4. Build HTML email (upcoming games first, then results)
5. Send via Resend API

## Configuration

- `favorites.json` — user preferences: `favoriteLeagues` (league IDs), `favoriteTeams` (per-league team abbreviations), `conferencePreferences` (ESPN group IDs for college sports)
- Environment variables: `RESEND_API_KEY` (required), `EMAIL_TO` (required, comma-separated), `EMAIL_FROM` (optional)

## Supported Sports

| League | ID | Display Type |
|---|---|---|
| NFL, NBA, MLB, NHL, MLS | `nfl`, `nba`, `mlb`, `nhl`, `mls` | matchup (two-team, scores, W/L) |
| College Football, College Basketball | `cfb`, `cbb` | matchup (with conference filtering) |
| Golf | `golf` | tournament (leaderboard, top 10) |
| UFC, F1 | `ufc`, `f1` | event (headline, records, winner) |
| Olympics, Boxing | `olympics`, `boxing` | event (currently disabled) |

## Testing

- Run all tests: `bun test`
- Test fixtures in `tests/fixtures/` (real ESPN API response snapshots)
- Tests cover: normalization, event fetching, email template, favorites logic, conference resolution

## Important Patterns

- **All dates use ET timezone** (`America/New_York`) — see `src/utils/dates.ts`
- **Exponential backoff** on ESPN requests — 3 retries, 1s/2s/4s delays
- **Favorite events are never truncated** — truncation only drops non-favorited events
- **One game per favorite team** — only the first appearance of each favorite team is marked
- **College sports** fetch each conference group separately and deduplicate by event ID

---

*When modifying this project, keep this file up to date with any structural changes.*
