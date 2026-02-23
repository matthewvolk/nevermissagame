import type { LeagueConfig } from "../config.ts";
import type { SportEvent } from "../events/types.ts";
import type { UserPreferences } from "./types.ts";

/**
 * Reorder leagues so favorited leagues appear first (in the order listed
 * in `prefs.favoriteLeagues`), followed by remaining leagues in their
 * original order.
 */
export function reorderLeagues(
  leagues: LeagueConfig[],
  prefs: UserPreferences,
): LeagueConfig[] {
  if (prefs.favoriteLeagues.length === 0) return leagues;

  const favSet = new Set(prefs.favoriteLeagues);
  const favLeagues: LeagueConfig[] = [];
  const rest: LeagueConfig[] = [];

  // Collect favorites in the order specified by prefs.favoriteLeagues
  for (const favId of prefs.favoriteLeagues) {
    const found = leagues.find((l) => l.id === favId);
    if (found) favLeagues.push(found);
  }

  // Remaining leagues in original order
  for (const league of leagues) {
    if (!favSet.has(league.id)) rest.push(league);
  }

  return [...favLeagues, ...rest];
}

/**
 * Mark events involving favorited teams with `favorited: true` and move
 * them to the front. Preserves chronological order within each group
 * (stable partition).
 */
export function prioritizeTeamEvents(
  events: SportEvent[],
  leagueId: string,
  prefs: UserPreferences,
): SportEvent[] {
  const favTeams = prefs.favoriteTeams[leagueId];
  if (!favTeams || favTeams.length === 0) return events;

  const favSet = new Set(favTeams.map((t) => t.toUpperCase()));
  const seenTeams = new Set<string>();

  const favorites: SportEvent[] = [];
  const rest: SportEvent[] = [];

  for (const event of events) {
    const homeAbbr = event.homeTeamAbbr?.toUpperCase();
    const awayAbbr = event.awayTeamAbbr?.toUpperCase();
    const homeFav = homeAbbr !== undefined && favSet.has(homeAbbr);
    const awayFav = awayAbbr !== undefined && favSet.has(awayAbbr);

    const homeNew = homeFav && !seenTeams.has(homeAbbr!);
    const awayNew = awayFav && !seenTeams.has(awayAbbr!);

    if (homeNew || awayNew) {
      const side =
        homeFav && awayFav ? "both" : homeFav ? "home" : "away";
      favorites.push({ ...event, favorited: true, favoritedSide: side });
      if (homeFav) seenTeams.add(homeAbbr!);
      if (awayFav) seenTeams.add(awayAbbr!);
    } else {
      rest.push(event);
    }
  }

  return [...favorites, ...rest];
}

/**
 * Keep ALL favorited events, then fill remaining slots with non-favorited
 * events up to `maxEvents`. Returns the displayed events and the total
 * count of non-favorited events (for "+N more" calculation).
 */
export function truncateWithFavorites(
  events: SportEvent[],
  maxEvents: number,
): { events: SportEvent[]; totalCount: number } {
  const favorited = events.filter((e) => e.favorited);
  const rest = events.filter((e) => !e.favorited);

  return {
    events: [...favorited, ...rest.slice(0, maxEvents)],
    totalCount: rest.length,
  };
}
