import { describe, test, expect } from "bun:test";
import {
  normalizeMatchupEvent,
  normalizeTournamentEvent,
  normalizeFightEvent,
  normalizeEvents,
} from "../../src/espn/normalize.ts";
import type { ESPNEvent } from "../../src/espn/types.ts";
import type { LeagueConfig } from "../../src/config.ts";
import nbaFixture from "../fixtures/nba-scoreboard.json";
import golfFixture from "../fixtures/golf-scoreboard.json";
import ufcFixture from "../fixtures/ufc-scoreboard.json";

const nbaLeague: LeagueConfig = {
  id: "nba",
  name: "NBA",
  espnPath: "basketball/nba",
  priority: 2,
  colors: { bg: "#c9500e", text: "#ffffff" },
  enabled: true,
  maxEvents: 5,
  displayType: "matchup",
};

const golfLeague: LeagueConfig = {
  id: "golf",
  name: "Golf",
  espnPath: "golf/pga",
  priority: 8,
  colors: { bg: "#006747", text: "#ffffff" },
  enabled: true,
  maxEvents: 5,
  displayType: "tournament",
};

const ufcLeague: LeagueConfig = {
  id: "ufc",
  name: "UFC",
  espnPath: "mma/ufc",
  priority: 10,
  colors: { bg: "#d20a0a", text: "#ffffff" },
  enabled: true,
  maxEvents: 5,
  displayType: "event",
};

describe("normalizeMatchupEvent", () => {
  const events = nbaFixture.events as unknown as ESPNEvent[];

  test("normalizes a completed NBA game", () => {
    const event = events[0]!;
    const result = normalizeMatchupEvent(event, "nba");

    expect(result).not.toBeNull();
    expect(result!.id).toBe(event.id);
    expect(result!.leagueId).toBe("nba");
    expect(result!.status).toBe("completed");
    expect(result!.homeTeam).toBeDefined();
    expect(result!.awayTeam).toBeDefined();
    expect(result!.homeScore).toBeNumber();
    expect(result!.awayScore).toBeNumber();
    expect(result!.date).toBeInstanceOf(Date);
  });

  test("populates homeTeamAbbr and awayTeamAbbr from fixture", () => {
    const event = events[0]!;
    const result = normalizeMatchupEvent(event, "nba");

    expect(result).not.toBeNull();
    expect(result!.homeTeamAbbr).toBeDefined();
    expect(result!.awayTeamAbbr).toBeDefined();
    expect(typeof result!.homeTeamAbbr).toBe("string");
    expect(typeof result!.awayTeamAbbr).toBe("string");
  });

  test("extracts home and away records from fixture", () => {
    const event = events[0]!;
    const result = normalizeMatchupEvent(event, "nba");

    expect(result).not.toBeNull();
    expect(result!.homeRecord).toBeDefined();
    expect(result!.awayRecord).toBeDefined();
    // NBA fixture records are in "W-L" format
    expect(result!.homeRecord).toMatch(/^\d+-\d+$/);
    expect(result!.awayRecord).toMatch(/^\d+-\d+$/);
  });

  test("returns null for event with no competitors", () => {
    const fakeEvent = {
      id: "1",
      name: "Test",
      shortName: "T",
      date: "2026-01-01T00:00:00Z",
      status: { type: { id: "1", name: "pre", state: "pre" as const, completed: false, description: "Scheduled" } },
      competitions: [{ id: "1", date: "2026-01-01T00:00:00Z", competitors: [] }],
    } satisfies ESPNEvent;

    expect(normalizeMatchupEvent(fakeEvent, "nba")).toBeNull();
  });
});

describe("normalizeTournamentEvent", () => {
  const events = golfFixture.events as unknown as ESPNEvent[];

  test("normalizes a golf tournament event", () => {
    const event = events[0]!;
    const result = normalizeTournamentEvent(event, "golf");

    expect(result).not.toBeNull();
    expect(result!.leagueId).toBe("golf");
    expect(result!.headline).toBeDefined();
    expect(result!.date).toBeInstanceOf(Date);
  });

  test("extracts top-10 leaderboard from golf tournament", () => {
    const event = events[0]!;
    const result = normalizeTournamentEvent(event, "golf");

    expect(result).not.toBeNull();
    expect(result!.leaderboard).toBeDefined();
    expect(result!.leaderboard!.length).toBe(10);
  });

  test("leaderboard first entry has correct data", () => {
    const event = events[0]!;
    const result = normalizeTournamentEvent(event, "golf");

    const first = result!.leaderboard![0]!;
    expect(first.position).toBe(1);
    expect(first.name).toBe("Jacob Bridgeman");
    expect(first.score).toBe("-19");
  });

  test("leaderboard is sorted by position", () => {
    const event = events[0]!;
    const result = normalizeTournamentEvent(event, "golf");

    const positions = result!.leaderboard!.map((e) => e.position);
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]!).toBeGreaterThanOrEqual(positions[i - 1]!);
    }
  });

  test("leaderboard detects tied positions", () => {
    const event = events[0]!;
    const result = normalizeTournamentEvent(event, "golf");

    // Kurt Kitayama and Xander Schauffele are both at -10 (positions 5-6)
    const tied = result!.leaderboard!.filter((e) => e.score === "-10");
    expect(tied.length).toBe(2);
    expect(tied[0]!.position).toBe(tied[1]!.position);
  });

  test("extracts statusDetail from competition status", () => {
    const event = events[0]!;
    const result = normalizeTournamentEvent(event, "golf");

    expect(result!.statusDetail).toBeDefined();
    expect(result!.statusDetail).toContain("Round");
  });
});

describe("normalizeFightEvent", () => {
  const events = ufcFixture.events as unknown as ESPNEvent[];

  test("normalizes a UFC event", () => {
    const event = events[0]!;
    const result = normalizeFightEvent(event, "ufc");

    expect(result).not.toBeNull();
    expect(result!.leagueId).toBe("ufc");
    expect(result!.date).toBeInstanceOf(Date);
  });

  test("extracts homeWinner when winner flag is set", () => {
    // First event/competition: competitors[0] is Wes Schultz (away, winner:true)
    // so homeWinner should be false (the away fighter won)
    const event = events[0]!;
    const result = normalizeFightEvent(event, "ufc");

    expect(result).not.toBeNull();
    expect(result!.homeWinner).toBe(false);
    expect(result!.status).toBe("completed");
  });

  test("extracts records from fight competitors", () => {
    const event = events[0]!;
    const result = normalizeFightEvent(event, "ufc");

    expect(result).not.toBeNull();
    expect(result!.homeRecord).toBeDefined();
    expect(result!.awayRecord).toBeDefined();
    expect(result!.homeRecord).toMatch(/^\d+-\d+-\d+$/);
    expect(result!.awayRecord).toMatch(/^\d+-\d+-\d+$/);
  });

  test("homeWinner is undefined for scheduled fights", () => {
    // Second event is still scheduled (both winner: false)
    const event = events[1]!;
    const result = normalizeFightEvent(event, "ufc");

    expect(result).not.toBeNull();
    expect(result!.homeWinner).toBeUndefined();
  });
});

describe("normalizeEvents", () => {
  test("normalizes all NBA events from fixture", () => {
    const events = nbaFixture.events as unknown as ESPNEvent[];
    const results = normalizeEvents(events, nbaLeague);

    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(events.length);
    for (const r of results) {
      expect(r.leagueId).toBe("nba");
    }
  });

  test("normalizes golf events as tournament type", () => {
    const events = golfFixture.events as unknown as ESPNEvent[];
    const results = normalizeEvents(events, golfLeague);

    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.leagueId).toBe("golf");
      expect(r.headline).toBeDefined();
    }
  });

  test("normalizes UFC events as event type", () => {
    const events = ufcFixture.events as unknown as ESPNEvent[];
    const results = normalizeEvents(events, ufcLeague);

    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.leagueId).toBe("ufc");
    }
  });
});
