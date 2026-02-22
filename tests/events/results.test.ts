import { describe, test, expect } from "bun:test";
import type { SportEvent } from "../../src/events/types.ts";

describe("results filtering", () => {
  test("filters to only completed events", () => {
    const events: SportEvent[] = [
      {
        id: "1",
        leagueId: "nba",
        name: "Completed Game",
        shortName: "CG",
        date: new Date("2026-02-21T00:00:00Z"),
        status: "completed",
        homeTeam: "Home",
        awayTeam: "Away",
        homeScore: 110,
        awayScore: 105,
      },
      {
        id: "2",
        leagueId: "nba",
        name: "Scheduled Game",
        shortName: "SG",
        date: new Date("2026-02-21T00:00:00Z"),
        status: "scheduled",
        homeTeam: "A",
        awayTeam: "B",
      },
    ];

    const completed = events.filter((e) => e.status === "completed");
    expect(completed.length).toBe(1);
    expect(completed[0]!.name).toBe("Completed Game");
    expect(completed[0]!.homeScore).toBe(110);
  });
});
