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
    const response = await fetchScoreboard(
      league.espnPath,
      dateRange,
      league.groups,
    );
    return normalizeEvents(response.events ?? [], league);
  } catch (err) {
    log.error(
      `Failed to fetch events for ${league.name}: ${err instanceof Error ? err.message : err}`,
    );
    return [];
  }
}
