export type LeagueConfig = {
  id: string;
  name: string;
  espnPath: string;
  priority: number;
  colors: { bg: string; text: string };
  enabled: boolean;
  /** ESPN group IDs for conference filtering (college sports) */
  groups?: number[];
  /** Max events to show per league */
  maxEvents: number;
  /** Display type for this sport */
  displayType: "matchup" | "tournament" | "event";
};

export const LEAGUES: LeagueConfig[] = [
  {
    id: "nfl",
    name: "NFL",
    espnPath: "football/nfl",
    priority: 1,
    colors: { bg: "#1a1a2e", text: "#ffffff" },
    enabled: true,
    maxEvents: 5,
    displayType: "matchup",
  },
  {
    id: "nba",
    name: "NBA",
    espnPath: "basketball/nba",
    priority: 2,
    colors: { bg: "#c9500e", text: "#ffffff" },
    enabled: true,
    maxEvents: 5,
    displayType: "matchup",
  },
  {
    id: "mlb",
    name: "MLB",
    espnPath: "baseball/mlb",
    priority: 3,
    colors: { bg: "#1e3a5f", text: "#ffffff" },
    enabled: true,
    maxEvents: 5,
    displayType: "matchup",
  },
  {
    id: "nhl",
    name: "NHL",
    espnPath: "hockey/nhl",
    priority: 4,
    colors: { bg: "#1b1b1b", text: "#ffffff" },
    enabled: true,
    maxEvents: 5,
    displayType: "matchup",
  },
  {
    id: "olympics",
    name: "Olympics",
    espnPath: "",
    priority: 5,
    colors: { bg: "#0085c7", text: "#ffffff" },
    enabled: false,
    maxEvents: 5,
    displayType: "event",
  },
  {
    id: "cfb",
    name: "College Football",
    espnPath: "football/college-football",
    priority: 6,
    colors: { bg: "#8b0000", text: "#ffffff" },
    enabled: true,
    maxEvents: 5,
    displayType: "matchup",
    // ESPN defaults to top conferences when no groups param is specified
  },
  {
    id: "cbb",
    name: "College Basketball",
    espnPath: "basketball/mens-college-basketball",
    priority: 7,
    colors: { bg: "#ff6600", text: "#ffffff" },
    enabled: true,
    maxEvents: 5,
    displayType: "matchup",
    // ESPN defaults to top conferences when no groups param is specified
  },
  {
    id: "golf",
    name: "Golf",
    espnPath: "golf/pga",
    priority: 8,
    colors: { bg: "#006747", text: "#ffffff" },
    enabled: true,
    maxEvents: 5,
    displayType: "tournament",
  },
  {
    id: "boxing",
    name: "Boxing",
    espnPath: "boxing/boxing",
    priority: 9,
    colors: { bg: "#8b0000", text: "#ffffff" },
    enabled: false, // ESPN boxing endpoint is unreliable
    maxEvents: 5,
    displayType: "event",
  },
  {
    id: "ufc",
    name: "UFC",
    espnPath: "mma/ufc",
    priority: 10,
    colors: { bg: "#d20a0a", text: "#ffffff" },
    enabled: true,
    maxEvents: 5,
    displayType: "event",
  },
  {
    id: "f1",
    name: "F1",
    espnPath: "racing/f1",
    priority: 11,
    colors: { bg: "#e10600", text: "#ffffff" },
    enabled: true,
    maxEvents: 5,
    displayType: "event",
  },
  {
    id: "mls",
    name: "MLS",
    espnPath: "soccer/usa.1",
    priority: 12,
    colors: { bg: "#1a1a2e", text: "#ffffff" },
    enabled: true,
    maxEvents: 5,
    displayType: "matchup",
  },
];

export const LOOKAHEAD_DAYS = 14;
export const ESPN_BASE_URL =
  "https://site.api.espn.com/apis/site/v2/sports";
export const MAX_RETRIES = 3;
export const RETRY_BASE_DELAY_MS = 1000;
export const REQUEST_TIMEOUT_MS = 10000;
export const INTER_REQUEST_DELAY_MS = 200;
