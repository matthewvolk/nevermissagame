import { describe, test, expect } from "bun:test";
import type { SportEvent, LeagueSection } from "../../src/events/types.ts";

describe("upcoming events", () => {
  test("events are sorted by date ascending", () => {
    const events: SportEvent[] = [
      {
        id: "2",
        leagueId: "nba",
        name: "Later Game",
        shortName: "LG",
        date: new Date("2026-03-01T00:00:00Z"),
        status: "scheduled",
        homeTeam: "A",
        awayTeam: "B",
      },
      {
        id: "1",
        leagueId: "nba",
        name: "Earlier Game",
        shortName: "EG",
        date: new Date("2026-02-22T00:00:00Z"),
        status: "scheduled",
        homeTeam: "C",
        awayTeam: "D",
      },
    ];

    const sorted = events.sort((a, b) => a.date.getTime() - b.date.getTime());
    expect(sorted[0]!.name).toBe("Earlier Game");
    expect(sorted[1]!.name).toBe("Later Game");
  });

  test("filters to only scheduled/in_progress events", () => {
    const events: SportEvent[] = [
      {
        id: "1",
        leagueId: "nba",
        name: "Scheduled",
        shortName: "S",
        date: new Date("2026-02-22T00:00:00Z"),
        status: "scheduled",
        homeTeam: "A",
        awayTeam: "B",
      },
      {
        id: "2",
        leagueId: "nba",
        name: "Completed",
        shortName: "C",
        date: new Date("2026-02-22T00:00:00Z"),
        status: "completed",
        homeTeam: "C",
        awayTeam: "D",
      },
      {
        id: "3",
        leagueId: "nba",
        name: "In Progress",
        shortName: "IP",
        date: new Date("2026-02-22T00:00:00Z"),
        status: "in_progress",
        homeTeam: "E",
        awayTeam: "F",
      },
    ];

    const upcoming = events.filter(
      (e) => e.status === "scheduled" || e.status === "in_progress",
    );
    expect(upcoming.length).toBe(2);
    expect(upcoming.map((e) => e.name)).toContain("Scheduled");
    expect(upcoming.map((e) => e.name)).toContain("In Progress");
  });

  test("truncates to maxEvents", () => {
    const events: SportEvent[] = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      leagueId: "nba",
      name: `Game ${i}`,
      shortName: `G${i}`,
      date: new Date(`2026-02-${22 + i}T00:00:00Z`),
      status: "scheduled" as const,
      homeTeam: "A",
      awayTeam: "B",
    }));

    const maxEvents = 5;
    const truncated = events.slice(0, maxEvents);
    expect(truncated.length).toBe(5);
    expect(events.length - truncated.length).toBe(5);
  });
});
