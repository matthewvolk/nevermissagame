import type { ESPNCompetitor, ESPNEvent } from "./types.ts";
import type {
  EventStatus,
  LeaderboardEntry,
  SportEvent,
} from "../events/types.ts";
import type { LeagueConfig } from "../config.ts";
import { createLogger } from "../utils/logger.ts";

const log = createLogger("normalize");

function mapStatus(state: string): EventStatus {
  switch (state) {
    case "post":
      return "completed";
    case "in":
      return "in_progress";
    default:
      return "scheduled";
  }
}

function extractBroadcast(event: ESPNEvent): string | undefined {
  const competition = event.competitions?.[0];
  if (!competition?.broadcasts) return undefined;

  for (const broadcast of competition.broadcasts) {
    if (broadcast.names && broadcast.names.length > 0) {
      return broadcast.names[0];
    }
  }
  return undefined;
}

function extractNote(event: ESPNEvent): string | undefined {
  const competition = event.competitions?.[0];
  if (!competition?.notes) return undefined;

  for (const note of competition.notes) {
    if (note.headline) return note.headline;
  }
  return undefined;
}

function extractEspnUrl(event: ESPNEvent): string | undefined {
  if (!event.links) return undefined;
  const gameLink = event.links.find(
    (l) => l.rel?.includes("event") || l.rel?.includes("gamecast"),
  );
  return gameLink?.href ?? event.links[0]?.href;
}

function extractVenue(event: ESPNEvent): string | undefined {
  const venue = event.competitions?.[0]?.venue;
  if (!venue) return undefined;
  return venue.fullName;
}

function extractRecord(competitor: ESPNCompetitor): string | undefined {
  return competitor.records?.find((r) => r.type === "total")?.summary;
}

export function normalizeMatchupEvent(
  event: ESPNEvent,
  leagueId: string,
): SportEvent | null {
  try {
    const competition = event.competitions?.[0];
    if (!competition?.competitors || competition.competitors.length < 2) {
      return null;
    }

    const home = competition.competitors.find((c) => c.homeAway === "home");
    const away = competition.competitors.find((c) => c.homeAway === "away");

    if (!home || !away) return null;

    const homeTeam =
      home.team?.shortDisplayName ?? home.team?.displayName ?? "TBD";
    const awayTeam =
      away.team?.shortDisplayName ?? away.team?.displayName ?? "TBD";

    return {
      id: event.id,
      leagueId,
      name: event.name,
      shortName: event.shortName,
      date: new Date(event.date),
      status: mapStatus(event.status.type.state),
      homeTeam,
      awayTeam,
      homeTeamAbbr: home.team?.abbreviation,
      awayTeamAbbr: away.team?.abbreviation,
      homeRecord: extractRecord(home),
      awayRecord: extractRecord(away),
      homeScore:
        home.score !== undefined ? parseInt(home.score, 10) : undefined,
      awayScore:
        away.score !== undefined ? parseInt(away.score, 10) : undefined,
      venue: extractVenue(event),
      broadcast: extractBroadcast(event),
      note: extractNote(event),
      espnUrl: extractEspnUrl(event),
    };
  } catch (err) {
    log.warn(`Failed to normalize matchup event ${event.id}: ${err}`);
    return null;
  }
}

function extractLeaderboard(event: ESPNEvent): LeaderboardEntry[] | undefined {
  const competitors = event.competitions?.[0]?.competitors;
  if (!competitors) return undefined;

  const valid = competitors.filter(
    (c) => c.order !== undefined && c.athlete?.displayName,
  );
  if (valid.length === 0) return undefined;

  valid.sort((a, b) => a.order! - b.order!);
  const top = valid.slice(0, 10);

  // Assign positions: players with the same score share the same position
  const entries: LeaderboardEntry[] = [];
  for (let i = 0; i < top.length; i++) {
    const c = top[i]!;
    // Find "today" score from the last round with an actual score
    const lastRound = c.linescores?.findLast(
      (l) => l.displayValue !== "-" && l.displayValue !== "",
    );

    // Position: if this player's score matches a previous player's score,
    // use that player's position (tied)
    let position = i + 1;
    for (let j = i - 1; j >= 0; j--) {
      if (top[j]!.score === c.score) {
        position = entries[j]!.position;
        break;
      } else {
        break;
      }
    }

    entries.push({
      position,
      name: c.athlete!.displayName,
      score: c.score ?? "E",
      today: lastRound?.displayValue,
    });
  }

  return entries;
}

function extractStatusDetail(event: ESPNEvent): string | undefined {
  const compStatus = event.competitions?.[0]?.status;
  return compStatus?.type?.shortDetail ?? compStatus?.type?.detail;
}

export function normalizeTournamentEvent(
  event: ESPNEvent,
  leagueId: string,
): SportEvent | null {
  try {
    return {
      id: event.id,
      leagueId,
      name: event.name,
      shortName: event.shortName || event.name,
      date: new Date(event.date),
      status: mapStatus(event.status.type.state),
      headline: event.name,
      venue: extractVenue(event),
      broadcast: extractBroadcast(event),
      note: extractNote(event),
      espnUrl: extractEspnUrl(event),
      leaderboard: extractLeaderboard(event),
      statusDetail: extractStatusDetail(event),
    };
  } catch (err) {
    log.warn(`Failed to normalize tournament event ${event.id}: ${err}`);
    return null;
  }
}

export function normalizeFightEvent(
  event: ESPNEvent,
  leagueId: string,
): SportEvent | null {
  try {
    const competition = event.competitions?.[0];
    let homeTeam: string | undefined;
    let awayTeam: string | undefined;
    let homeTeamAbbr: string | undefined;
    let awayTeamAbbr: string | undefined;

    let homeRecord: string | undefined;
    let awayRecord: string | undefined;
    let homeWinner: boolean | undefined;

    if (competition?.competitors && competition.competitors.length >= 2) {
      const c1 = competition.competitors[0];
      const c2 = competition.competitors[1];
      awayTeam =
        c1?.athlete?.displayName ??
        c1?.team?.displayName ??
        "Fighter 1";
      homeTeam =
        c2?.athlete?.displayName ??
        c2?.team?.displayName ??
        "Fighter 2";
      awayTeamAbbr = c1?.team?.abbreviation;
      homeTeamAbbr = c2?.team?.abbreviation;
      if (c1) awayRecord = extractRecord(c1);
      if (c2) homeRecord = extractRecord(c2);

      // ESPN sets winner: true on the winning competitor
      if (c2?.winner === true) {
        homeWinner = true;
      } else if (c1?.winner === true) {
        homeWinner = false;
      }
    }

    return {
      id: event.id,
      leagueId,
      name: event.name,
      shortName: event.shortName || event.name,
      date: new Date(event.date),
      status: mapStatus(event.status.type.state),
      homeTeam,
      awayTeam,
      homeTeamAbbr,
      awayTeamAbbr,
      homeRecord,
      awayRecord,
      homeWinner,
      headline: event.name,
      venue: extractVenue(event),
      broadcast: extractBroadcast(event),
      note: extractNote(event),
      espnUrl: extractEspnUrl(event),
    };
  } catch (err) {
    log.warn(`Failed to normalize fight event ${event.id}: ${err}`);
    return null;
  }
}

export function normalizeEvents(
  events: ESPNEvent[],
  league: LeagueConfig,
): SportEvent[] {
  const normalized: SportEvent[] = [];

  for (const event of events) {
    let result: SportEvent | null = null;

    switch (league.displayType) {
      case "matchup":
        result = normalizeMatchupEvent(event, league.id);
        break;
      case "tournament":
        result = normalizeTournamentEvent(event, league.id);
        break;
      case "event":
        // For UFC/boxing, try fight-style first, fall back to tournament-style
        result = normalizeFightEvent(event, league.id);
        break;
    }

    if (result) {
      normalized.push(result);
    }
  }

  return normalized;
}
