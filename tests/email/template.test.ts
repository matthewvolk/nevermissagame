import { describe, test, expect } from "bun:test";
import { buildEmailHtml } from "../../src/email/template.ts";
import type { LeagueSection } from "../../src/events/types.ts";

describe("buildEmailHtml", () => {
  const mockResults: LeagueSection[] = [
    {
      leagueId: "nba",
      leagueName: "NBA",
      colors: { bg: "#c9500e", text: "#ffffff" },
      events: [
        {
          id: "1",
          leagueId: "nba",
          name: "Test Game",
          shortName: "TST @ HOM",
          date: new Date("2026-02-21T00:00:00Z"),
          status: "completed",
          homeTeam: "Home Team",
          awayTeam: "Away Team",
          homeScore: 110,
          awayScore: 105,
        },
      ],
      totalCount: 1,
    },
  ];

  const mockUpcoming: LeagueSection[] = [
    {
      leagueId: "nfl",
      leagueName: "NFL",
      colors: { bg: "#1a1a2e", text: "#ffffff" },
      events: [
        {
          id: "2",
          leagueId: "nfl",
          name: "Upcoming Game",
          shortName: "AW @ HM",
          date: new Date("2026-02-25T23:00:00Z"),
          status: "scheduled",
          homeTeam: "Home",
          awayTeam: "Away",
          broadcast: "ESPN",
        },
      ],
      totalCount: 1,
    },
  ];

  test("generates valid HTML with results and upcoming", () => {
    const html = buildEmailHtml(mockResults, mockUpcoming, new Date("2026-02-22"));

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Weekly Rundown");
    expect(html).toContain("Upcoming Games");
    expect(html).toContain("Yesterday");
    expect(html).toContain("FINAL");
    expect(html).toContain("NBA");
    expect(html).toContain("NFL");
    expect(html).toContain("Away Team");
    expect(html).toContain("Home Team");
    expect(html).toContain("110");
    expect(html).toContain("105");
    expect(html).toContain("ESPN");
    expect(html).toContain("Manage preferences");
    expect(html).toContain("Unsubscribe");
  });

  test("shows empty state when no data", () => {
    const html = buildEmailHtml([], [], new Date("2026-02-22"));
    expect(html).toContain("Unable to fetch sports data");
  });

  test("omits results section when empty", () => {
    const html = buildEmailHtml([], mockUpcoming, new Date("2026-02-22"));
    expect(html).not.toContain("Yesterday");
    expect(html).toContain("Upcoming Games");
  });

  test("shows +N more when truncated", () => {
    const section: LeagueSection = {
      leagueId: "nba",
      leagueName: "NBA",
      colors: { bg: "#c9500e", text: "#ffffff" },
      events: [
        {
          id: "1",
          leagueId: "nba",
          name: "Game 1",
          shortName: "G1",
          date: new Date("2026-02-22T00:00:00Z"),
          status: "scheduled",
          homeTeam: "A",
          awayTeam: "B",
        },
      ],
      totalCount: 10,
    };

    const html = buildEmailHtml([], [section], new Date("2026-02-22"));
    expect(html).toContain("+ 9 more");
  });
});
