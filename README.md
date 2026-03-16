# Never Miss a Game

A daily sports email digest that delivers yesterday's scores and upcoming games straight to your inbox.

## Overview

Never Miss a Game pulls scores and schedules from the ESPN API, builds an HTML email with results and upcoming games, and sends it via [Resend](https://resend.com). It runs daily as a GitHub Actions cron job — no server required.

You configure which leagues appear in the email, which teams are your favorites, and which college conferences you care about. Only leagues listed in `favoriteLeagues` are included. Favorite teams are always shown first and never truncated.

## Prerequisites

- [Bun](https://bun.sh) runtime
- A [Resend](https://resend.com) API key

## Setup

```sh
git clone https://github.com/matthewvolk/nevermissagame.git
cd nevermissagame
bun install
```

Copy the example environment file and fill in your values:

```sh
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `RESEND_API_KEY` | Yes | Your Resend API key |
| `EMAIL_TO` | Yes | Recipient email address(es), comma-separated |
| `EMAIL_FROM` | No | Sender address (defaults to `onboarding@resend.dev`) |

Edit `favorites.json` to set your preferences:

```json
{
  "favoriteLeagues": ["mlb"],
  "favoriteTeams": {
    "mlb": ["SD"],
    "cbb": ["SDSU"],
    "cfb": ["SDSU"]
  },
  "conferencePreferences": {
    "cfb": [1, 4, 5, 8, 17],
    "cbb": [2, 7, 8, 23, 44]
  }
}
```

- **favoriteLeagues** — league IDs to include in the email (only these leagues are shown, in the order listed; empty list shows all leagues)
- **favoriteTeams** — team abbreviations per league (these games are always shown and never truncated)
- **conferencePreferences** — ESPN group IDs for college sports (overrides default power conference filtering)

## Preview Locally

Generate a preview of the email without sending:

```sh
bun run src/preview.ts
```

This writes `preview.html` and opens it in your browser. Use `--date` to simulate a different day:

```sh
bun run src/preview.ts --date 2025-01-15
```

## Send Email

```sh
bun run src/index.ts
```

## Supported Sports

| Sport | Display | Notes |
|---|---|---|
| NFL | Matchup | Scores, W/L indicators, records |
| NBA | Matchup | Scores, W/L indicators, records |
| MLB | Matchup | Scores, W/L indicators, records |
| NHL | Matchup | Scores, W/L indicators, records |
| MLS | Matchup | Scores, W/L indicators, records |
| College Football | Matchup | Conference filtering via group IDs |
| College Basketball | Matchup | Conference filtering via group IDs |
| Golf | Tournament | Top-10 leaderboard with positions and round scores |
| UFC | Event | Fight results with winner indicators |
| F1 | Event | Race results |

Olympics and Boxing are defined but currently disabled.

## Deployment

The included GitHub Actions workflow (`.github/workflows/daily-email.yml`) runs daily at 11:00 UTC (6 AM ET). It can also be triggered manually via `workflow_dispatch`.

Required GitHub secrets: `RESEND_API_KEY`, `EMAIL_TO`. Optional variable: `EMAIL_FROM`.

## Testing

```sh
bun test
```

Tests use real ESPN API response snapshots stored in `tests/fixtures/`.
