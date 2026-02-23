import { LEAGUES, INTER_REQUEST_DELAY_MS } from "../config.ts";
import { fetchLeagueEvents } from "../espn/scoreboard.ts";
import { yesterdayET, formatDateESPN } from "../utils/dates.ts";
import type { LeagueSection } from "./types.ts";
import { createLogger } from "../utils/logger.ts";
import { type UserPreferences, EMPTY_PREFERENCES } from "../favorites/types.ts";
import {
  reorderLeagues,
  prioritizeTeamEvents,
  truncateWithFavorites,
} from "../favorites/apply.ts";
import { resolveLeagueGroups } from "../conferences/resolve.ts";

const log = createLogger("results");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchYesterdayResults(
  referenceDate?: Date,
  preferences: UserPreferences = EMPTY_PREFERENCES,
): Promise<LeagueSection[]> {
  const yesterday = referenceDate ?? yesterdayET();
  const dateRange = formatDateESPN(yesterday);
  log.info(`Fetching yesterday's results for ${dateRange}`);

  const sections: LeagueSection[] = [];
  const enabledLeagues = reorderLeagues(
    LEAGUES.filter((l) => l.enabled && l.espnPath),
    preferences,
  );

  for (let i = 0; i < enabledLeagues.length; i++) {
    const league = enabledLeagues[i]!;

    if (i > 0) {
      await sleep(INTER_REQUEST_DELAY_MS);
    }

    const resolved = resolveLeagueGroups(league, preferences);
    const events = await fetchLeagueEvents(resolved, dateRange);

    // Filter to completed events, plus in-progress tournaments (for leaderboards)
    const completed = events
      .filter((e) => {
        if (e.status === "completed") return true;
        if (e.status === "in_progress" && league.displayType === "tournament")
          return true;
        return false;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (completed.length === 0) continue;

    // Prioritize favorite team events, then truncate
    const prioritized = prioritizeTeamEvents(completed, league.id, preferences);
    const { events: displayed, totalCount } = truncateWithFavorites(
      prioritized,
      league.maxEvents,
    );

    sections.push({
      leagueId: league.id,
      leagueName: league.name,
      colors: league.colors,
      events: displayed,
      totalCount,
    });
  }

  return sections;
}
