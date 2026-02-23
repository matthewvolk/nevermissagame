import type { LeagueConfig } from "../config.ts";
import { fetchScoreboard } from "./client.ts";
import { normalizeEvents } from "./normalize.ts";
import type { SportEvent } from "../events/types.ts";
import { createLogger } from "../utils/logger.ts";

const log = createLogger("scoreboard");

export async function fetchLeagueEvents(
  league: LeagueConfig,
  dateRange: string,
): Promise<SportEvent[]> {
  if (!league.enabled || !league.espnPath) {
    return [];
  }

  try {
    // ESPN only accepts a single group ID per request, so we fetch each
    // conference separately and deduplicate by event ID.
    if (league.groups && league.groups.length > 0) {
      const seenIds = new Set<string>();
      const allEvents: SportEvent[] = [];

      for (const group of league.groups) {
        const response = await fetchScoreboard(
          league.espnPath,
          dateRange,
          group,
        );
        for (const event of normalizeEvents(response.events ?? [], league)) {
          if (!seenIds.has(event.id)) {
            seenIds.add(event.id);
            allEvents.push(event);
          }
        }
      }

      return allEvents;
    }

    const response = await fetchScoreboard(league.espnPath, dateRange);
    return normalizeEvents(response.events ?? [], league);
  } catch (err) {
    log.error(
      `Failed to fetch events for ${league.name}: ${err instanceof Error ? err.message : err}`,
    );
    return [];
  }
}
