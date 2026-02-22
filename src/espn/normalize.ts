import type { ESPNEvent } from "./types.ts";
import type { EventStatus, SportEvent } from "../events/types.ts";
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
