import { LEAGUES, LOOKAHEAD_DAYS, INTER_REQUEST_DELAY_MS } from "../config.ts";
import { fetchLeagueEvents } from "../espn/scoreboard.ts";
import {
  todayET,
  daysFromTodayET,
  formatDateESPN,
} from "../utils/dates.ts";
import type { LeagueSection, SportEvent } from "./types.ts";
import { createLogger } from "../utils/logger.ts";

const log = createLogger("upcoming");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchUpcomingEvents(
  referenceDate?: Date,
): Promise<LeagueSection[]> {
  const start = referenceDate ?? todayET();
  const end = new Date(start);
  end.setDate(end.getDate() + LOOKAHEAD_DAYS);

  const dateRange = `${formatDateESPN(start)}-${formatDateESPN(end)}`;
  log.info(`Fetching upcoming events for ${dateRange}`);

  const sections: LeagueSection[] = [];
  const enabledLeagues = LEAGUES.filter((l) => l.enabled && l.espnPath);

  for (let i = 0; i < enabledLeagues.length; i++) {
    const league = enabledLeagues[i]!;

    if (i > 0) {
      await sleep(INTER_REQUEST_DELAY_MS);
    }

    const events = await fetchLeagueEvents(league, dateRange);

    // Filter to only scheduled/upcoming events, sort by date
    const upcoming = events
      .filter((e) => e.status === "scheduled" || e.status === "in_progress")
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (upcoming.length === 0) continue;

    sections.push({
      leagueId: league.id,
      leagueName: league.name,
      colors: league.colors,
      events: upcoming.slice(0, league.maxEvents),
      totalCount: upcoming.length,
    });
  }

  return sections;
}
