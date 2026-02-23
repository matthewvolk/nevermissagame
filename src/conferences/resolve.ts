import type { LeagueConfig } from "../config.ts";
import type { UserPreferences } from "../favorites/types.ts";
import { POWER_CONFERENCE_GROUPS } from "./types.ts";

/**
 * Resolves the `groups` array for a league based on user preferences.
 * Non-college leagues pass through unchanged.
 */
export function resolveLeagueGroups(
  league: LeagueConfig,
  preferences: UserPreferences,
): LeagueConfig {
  const defaults = POWER_CONFERENCE_GROUPS[league.id];
  if (!defaults) return league;

  const userGroups = preferences.conferencePreferences?.[league.id];
  const groups = userGroups ?? defaults;

  return { ...league, groups };
}
