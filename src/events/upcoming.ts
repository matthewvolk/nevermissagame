import { LEAGUES, LOOKAHEAD_DAYS, INTER_REQUEST_DELAY_MS } from "../config.ts";
import { fetchLeagueEvents } from "../espn/scoreboard.ts";
import {
  todayET,
  daysFromTodayET,
  formatDateESPN,
} from "../utils/dates.ts";
import type { LeagueSection, SportEvent } from "./types.ts";
import { createLogger } from "../utils/logger.ts";
import { type UserPreferences, EMPTY_PREFERENCES } from "../favorites/types.ts";
import {
  reorderLeagues,
  prioritizeTeamEvents,
  truncateWithFavorites,
} from "../favorites/apply.ts";
import { resolveLeagueGroups } from "../conferences/resolve.ts";

const log = createLogger("upcoming");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchUpcomingEvents(
  referenceDate?: Date,
  preferences: UserPreferences = EMPTY_PREFERENCES,
): Promise<LeagueSection[]> {
  const start = referenceDate ?? todayET();
  const end = new Date(start);
  end.setDate(end.getDate() + LOOKAHEAD_DAYS);

  const dateRange = `${formatDateESPN(start)}-${formatDateESPN(end)}`;
  log.info(`Fetching upcoming events for ${dateRange}`);

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

    // Filter to only scheduled/upcoming events, sort by date
    // Exclude in-progress tournaments (they appear in results with a leaderboard)
    const upcoming = events
      .filter((e) => e.status === "scheduled" || e.status === "in_progress")
      .filter(
        (e) =>
          !(e.status === "in_progress" && league.displayType === "tournament"),
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (upcoming.length === 0) continue;

    // Prioritize favorite team events, then truncate
    const prioritized = prioritizeTeamEvents(upcoming, league.id, preferences);
    const { events: displayed, totalCount } = truncateWithFavorites(
      prioritized,
      league.maxEvents,
    );

    let scheduleUrl: string | undefined;
    if (league.espnScheduleSlug) {
      const query = league.espnScheduleQuery ? `/_/${league.espnScheduleQuery}` : "";
      scheduleUrl = `https://www.espn.com/${league.espnScheduleSlug}/schedule${query}`;
    }

    sections.push({
      leagueId: league.id,
      leagueName: league.name,
      colors: league.colors,
      events: displayed,
      totalCount,
      scheduleUrl,
    });
  }

  return sections;
}
