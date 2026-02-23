import { describe, test, expect } from "bun:test";
import { resolveLeagueGroups } from "../../src/conferences/resolve.ts";
import { POWER_CONFERENCE_GROUPS } from "../../src/conferences/types.ts";
import type { LeagueConfig } from "../../src/config.ts";
import { EMPTY_PREFERENCES } from "../../src/favorites/types.ts";
import type { UserPreferences } from "../../src/favorites/types.ts";

const nflLeague: LeagueConfig = {
  id: "nfl",
  name: "NFL",
  espnPath: "football/nfl",
  priority: 1,
  colors: { bg: "#1a1a2e", text: "#ffffff" },
  enabled: true,
  maxEvents: 5,
  displayType: "matchup",
};

const cfbLeague: LeagueConfig = {
  id: "cfb",
  name: "College Football",
  espnPath: "football/college-football",
  priority: 6,
  colors: { bg: "#8b0000", text: "#ffffff" },
  enabled: true,
  maxEvents: 5,
  displayType: "matchup",
};

const cbbLeague: LeagueConfig = {
  id: "cbb",
  name: "College Basketball",
  espnPath: "basketball/mens-college-basketball",
  priority: 7,
  colors: { bg: "#ff6600", text: "#ffffff" },
  enabled: true,
  maxEvents: 5,
  displayType: "matchup",
};

describe("resolveLeagueGroups", () => {
  test("non-college league passes through unchanged", () => {
    const result = resolveLeagueGroups(nflLeague, EMPTY_PREFERENCES);
    expect(result).toBe(nflLeague);
  });

  test("college league with no user prefs gets power conference defaults", () => {
    const result = resolveLeagueGroups(cfbLeague, EMPTY_PREFERENCES);
    expect(result.groups).toEqual(POWER_CONFERENCE_GROUPS.cfb);
    expect(result.id).toBe("cfb");
  });

  test("cbb league with no user prefs gets power conference defaults", () => {
    const result = resolveLeagueGroups(cbbLeague, EMPTY_PREFERENCES);
    expect(result.groups).toEqual(POWER_CONFERENCE_GROUPS.cbb);
  });

  test("college league with user prefs uses the user's array directly", () => {
    const prefs: UserPreferences = {
      ...EMPTY_PREFERENCES,
      conferencePreferences: {
        cfb: [1, 4, 5, 8, 17],
      },
    };
    const result = resolveLeagueGroups(cfbLeague, prefs);
    expect(result.groups).toEqual([1, 4, 5, 8, 17]);
  });

  test("empty array in user prefs results in empty groups", () => {
    const prefs: UserPreferences = {
      ...EMPTY_PREFERENCES,
      conferencePreferences: {
        cfb: [],
      },
    };
    const result = resolveLeagueGroups(cfbLeague, prefs);
    expect(result.groups).toEqual([]);
  });

  test("does not mutate the original league config", () => {
    const result = resolveLeagueGroups(cfbLeague, EMPTY_PREFERENCES);
    expect(result).not.toBe(cfbLeague);
    expect(cfbLeague.groups).toBeUndefined();
  });

  test("user prefs for one league do not affect another", () => {
    const prefs: UserPreferences = {
      ...EMPTY_PREFERENCES,
      conferencePreferences: {
        cfb: [1, 17],
      },
    };
    const result = resolveLeagueGroups(cbbLeague, prefs);
    expect(result.groups).toEqual(POWER_CONFERENCE_GROUPS.cbb);
  });
});
