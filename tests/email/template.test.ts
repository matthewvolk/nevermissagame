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
    expect(html).toContain("Daily Digest");
    expect(html).toContain("Never Miss a Game");
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
    expect(html).toContain("Never Miss a Game");
  });

  test("shows W indicator for winning team and L for losing team", () => {
    const html = buildEmailHtml(mockResults, [], new Date("2026-02-22"));
    // Home Team scored 110 (winner), Away Team scored 105 (loser)
    expect(html).toContain('Home Team 110</span><span style="color:#16a34a;font-weight:700;margin-left:4px;font-size:12px">W</span>');
    expect(html).toContain('Away Team 105</span><span style="color:#dc2626;font-weight:700;margin-left:4px;font-size:12px">L</span>');
  });

  test("renders leaderboard for tournament events", () => {
    const golfResults: LeagueSection[] = [
      {
        leagueId: "golf",
        leagueName: "Golf",
        colors: { bg: "#006747", text: "#ffffff" },
        events: [
          {
            id: "10",
            leagueId: "golf",
            name: "The Genesis Invitational",
            shortName: "Genesis",
            date: new Date("2026-02-22T00:00:00Z"),
            status: "in_progress",
            headline: "The Genesis Invitational",
            statusDetail: "Round 4 - In Progress",
            leaderboard: [
              { position: 1, name: "Jacob Bridgeman", score: "-19", today: "-7" },
              { position: 2, name: "Rory McIlroy", score: "-13", today: "-5" },
              { position: 3, name: "Aldrich Potgieter", score: "-12", today: "-4" },
              { position: 4, name: "Aaron Rai", score: "-11", today: "-3" },
              { position: 5, name: "Kurt Kitayama", score: "-10", today: "-2" },
              { position: 5, name: "Xander Schauffele", score: "-10", today: "-2" },
            ],
          },
        ],
        totalCount: 1,
      },
    ];

    const html = buildEmailHtml(golfResults, [], new Date("2026-02-22"));

    expect(html).toContain("The Genesis Invitational");
    expect(html).toContain("Jacob Bridgeman");
    expect(html).toContain("-19");
    expect(html).toContain("Rory McIlroy");
    expect(html).toContain("ROUND 4 - IN PROGRESS");
    // Tied position prefix
    expect(html).toContain("T5");
    // Today column
    expect(html).toContain("Today");
    expect(html).toContain("-7");
  });

  test("shows W/L indicators for fight results using homeWinner flag", () => {
    const ufcResults: LeagueSection[] = [
      {
        leagueId: "ufc",
        leagueName: "UFC",
        colors: { bg: "#d20a0a", text: "#ffffff" },
        events: [
          {
            id: "100",
            leagueId: "ufc",
            name: "Fighter A vs Fighter B",
            shortName: "UFC Fight Night",
            date: new Date("2026-02-21T00:00:00Z"),
            status: "completed",
            homeTeam: "Fighter B",
            awayTeam: "Fighter A",
            homeWinner: true,
            homeRecord: "10-2-0",
            awayRecord: "8-3-0",
          },
        ],
        totalCount: 1,
      },
    ];

    const html = buildEmailHtml(ufcResults, [], new Date("2026-02-22"));
    // Home fighter (Fighter B) won
    expect(html).toContain('Fighter B</span><span style="color:#16a34a;font-weight:700;margin-left:4px;font-size:12px">W</span>');
    expect(html).toContain('Fighter A</span><span style="color:#dc2626;font-weight:700;margin-left:4px;font-size:12px">L</span>');
    // Records should be shown
    expect(html).toContain("(10-2-0)");
    expect(html).toContain("(8-3-0)");
    // FINAL should be shown
    expect(html).toContain("FINAL");
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
