import { LEAGUES, INTER_REQUEST_DELAY_MS } from "../config.ts";
import { fetchLeagueEvents } from "../espn/scoreboard.ts";
import { yesterdayET, formatDateESPN } from "../utils/dates.ts";
import type { LeagueSection } from "./types.ts";
import { createLogger } from "../utils/logger.ts";

const log = createLogger("results");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchYesterdayResults(
  referenceDate?: Date,
): Promise<LeagueSection[]> {
  const yesterday = referenceDate ?? yesterdayET();
  const dateRange = formatDateESPN(yesterday);
  log.info(`Fetching yesterday's results for ${dateRange}`);

  const sections: LeagueSection[] = [];
  const enabledLeagues = LEAGUES.filter((l) => l.enabled && l.espnPath);

  for (let i = 0; i < enabledLeagues.length; i++) {
    const league = enabledLeagues[i]!;

    if (i > 0) {
      await sleep(INTER_REQUEST_DELAY_MS);
    }

    const events = await fetchLeagueEvents(league, dateRange);

    // Filter to only completed events
    const completed = events
      .filter((e) => e.status === "completed")
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (completed.length === 0) continue;

    sections.push({
      leagueId: league.id,
      leagueName: league.name,
      colors: league.colors,
      events: completed.slice(0, league.maxEvents),
      totalCount: completed.length,
    });
  }

  return sections;
}
