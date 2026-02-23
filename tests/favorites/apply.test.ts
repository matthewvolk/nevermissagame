import { describe, test, expect } from "bun:test";
import {
  reorderLeagues,
  prioritizeTeamEvents,
  truncateWithFavorites,
} from "../../src/favorites/apply.ts";
import type { LeagueConfig } from "../../src/config.ts";
import type { SportEvent } from "../../src/events/types.ts";
import { EMPTY_PREFERENCES } from "../../src/favorites/types.ts";
import type { UserPreferences } from "../../src/favorites/types.ts";

const makeLeague = (id: string, priority: number): LeagueConfig => ({
  id,
  name: id.toUpperCase(),
  espnPath: `sport/${id}`,
  priority,
  colors: { bg: "#000", text: "#fff" },
  enabled: true,
  maxEvents: 5,
  displayType: "matchup",
});

const makeEvent = (
  id: string,
  opts: {
    homeTeamAbbr?: string;
    awayTeamAbbr?: string;
    date?: Date;
    favorited?: boolean;
  } = {},
): SportEvent => ({
  id,
  leagueId: "mlb",
  name: `Game ${id}`,
  shortName: `G${id}`,
  date: opts.date ?? new Date("2026-06-15T19:00:00Z"),
  status: "scheduled",
  homeTeam: "Home",
  awayTeam: "Away",
  homeTeamAbbr: opts.homeTeamAbbr,
  awayTeamAbbr: opts.awayTeamAbbr,
  favorited: opts.favorited,
});

describe("reorderLeagues", () => {
  const leagues = [
    makeLeague("nfl", 1),
    makeLeague("nba", 2),
    makeLeague("mlb", 3),
    makeLeague("nhl", 4),
  ];

  test("favorites come first in specified order", () => {
    const prefs: UserPreferences = {
      favoriteLeagues: ["mlb", "nhl"],
      favoriteTeams: {},
    };
    const result = reorderLeagues(leagues, prefs);
    expect(result.map((l) => l.id)).toEqual(["mlb", "nhl", "nfl", "nba"]);
  });

  test("empty favorites returns original order", () => {
    const result = reorderLeagues(leagues, EMPTY_PREFERENCES);
    expect(result.map((l) => l.id)).toEqual(["nfl", "nba", "mlb", "nhl"]);
  });

  test("unknown league ID silently skipped", () => {
    const prefs: UserPreferences = {
      favoriteLeagues: ["cricket", "mlb"],
      favoriteTeams: {},
    };
    const result = reorderLeagues(leagues, prefs);
    expect(result.map((l) => l.id)).toEqual(["mlb", "nfl", "nba", "nhl"]);
  });
});

describe("prioritizeTeamEvents", () => {
  test("favorite team events move to front", () => {
    const events = [
      makeEvent("1", { homeTeamAbbr: "NYY", awayTeamAbbr: "BOS" }),
      makeEvent("2", { homeTeamAbbr: "SD", awayTeamAbbr: "LAD" }),
      makeEvent("3", { homeTeamAbbr: "SF", awayTeamAbbr: "ARI" }),
    ];
    const prefs: UserPreferences = {
      favoriteLeagues: [],
      favoriteTeams: { mlb: ["SD"] },
    };
    const result = prioritizeTeamEvents(events, "mlb", prefs);
    expect(result[0]!.id).toBe("2");
    expect(result[0]!.favorited).toBe(true);
    expect(result[1]!.favorited).toBeUndefined();
  });

  test("matches away team too", () => {
    const events = [
      makeEvent("1", { homeTeamAbbr: "LAD", awayTeamAbbr: "SD" }),
    ];
    const prefs: UserPreferences = {
      favoriteLeagues: [],
      favoriteTeams: { mlb: ["SD"] },
    };
    const result = prioritizeTeamEvents(events, "mlb", prefs);
    expect(result[0]!.favorited).toBe(true);
  });

  test("multiple favorite teams", () => {
    const events = [
      makeEvent("1", { homeTeamAbbr: "NYY", awayTeamAbbr: "BOS" }),
      makeEvent("2", { homeTeamAbbr: "SD", awayTeamAbbr: "LAD" }),
      makeEvent("3", { homeTeamAbbr: "SF", awayTeamAbbr: "ARI" }),
      makeEvent("4", { homeTeamAbbr: "NYY", awayTeamAbbr: "SF" }),
    ];
    const prefs: UserPreferences = {
      favoriteLeagues: [],
      favoriteTeams: { mlb: ["SD", "NYY"] },
    };
    const result = prioritizeTeamEvents(events, "mlb", prefs);
    const favIds = result.filter((e) => e.favorited).map((e) => e.id);
    // Only the first game per favorite team is marked
    expect(favIds).toEqual(["1", "2"]);
  });

  test("preserves chronological order within each group", () => {
    const events = [
      makeEvent("1", {
        homeTeamAbbr: "NYY",
        awayTeamAbbr: "BOS",
        date: new Date("2026-06-15T19:00:00Z"),
      }),
      makeEvent("2", {
        homeTeamAbbr: "SD",
        awayTeamAbbr: "LAD",
        date: new Date("2026-06-15T20:00:00Z"),
      }),
      makeEvent("3", {
        homeTeamAbbr: "SF",
        awayTeamAbbr: "SD",
        date: new Date("2026-06-15T21:00:00Z"),
      }),
    ];
    const prefs: UserPreferences = {
      favoriteLeagues: [],
      favoriteTeams: { mlb: ["SD"] },
    };
    const result = prioritizeTeamEvents(events, "mlb", prefs);
    // Only the first SD game (2) is favorited; second SD game (3) is not
    expect(result[0]!.id).toBe("2");
    expect(result[0]!.favorited).toBe(true);
    // Non-favorites after, in original order
    expect(result[1]!.id).toBe("1");
    expect(result[2]!.id).toBe("3");
  });

  test("case-insensitive matching", () => {
    const events = [
      makeEvent("1", { homeTeamAbbr: "sd", awayTeamAbbr: "LAD" }),
    ];
    const prefs: UserPreferences = {
      favoriteLeagues: [],
      favoriteTeams: { mlb: ["SD"] },
    };
    const result = prioritizeTeamEvents(events, "mlb", prefs);
    expect(result[0]!.favorited).toBe(true);
  });

  test("no favorites for league returns unchanged", () => {
    const events = [
      makeEvent("1", { homeTeamAbbr: "SD", awayTeamAbbr: "LAD" }),
    ];
    const prefs: UserPreferences = {
      favoriteLeagues: [],
      favoriteTeams: { nba: ["LAL"] },
    };
    const result = prioritizeTeamEvents(events, "mlb", prefs);
    expect(result[0]!.favorited).toBeUndefined();
  });

  test("events without abbreviation not matched", () => {
    const events = [makeEvent("1")]; // no abbreviations set
    const prefs: UserPreferences = {
      favoriteLeagues: [],
      favoriteTeams: { mlb: ["SD"] },
    };
    const result = prioritizeTeamEvents(events, "mlb", prefs);
    expect(result[0]!.favorited).toBeUndefined();
  });
});

describe("truncateWithFavorites", () => {
  test("keeps all favorited events plus maxEvents non-favorited", () => {
    const events = [
      makeEvent("f1", { favorited: true }),
      makeEvent("f2", { favorited: true }),
      makeEvent("r1"),
      makeEvent("r2"),
      makeEvent("r3"),
      makeEvent("r4"),
      makeEvent("r5"),
      makeEvent("r6"),
    ];
    const result = truncateWithFavorites(events, 3);
    expect(result.events.length).toBe(5); // 2 fav + 3 rest
    expect(result.events[0]!.id).toBe("f1");
    expect(result.events[1]!.id).toBe("f2");
    expect(result.totalCount).toBe(6); // 6 non-fav total
  });

  test("no favorited events behaves like normal truncation", () => {
    const events = [
      makeEvent("1"),
      makeEvent("2"),
      makeEvent("3"),
      makeEvent("4"),
      makeEvent("5"),
      makeEvent("6"),
    ];
    const result = truncateWithFavorites(events, 3);
    expect(result.events.length).toBe(3);
    expect(result.totalCount).toBe(6);
  });
});
