export type EventStatus = "scheduled" | "in_progress" | "completed";

export type SportEvent = {
  id: string;
  leagueId: string;
  name: string;
  shortName: string;
  date: Date;
  status: EventStatus;
  /** For matchup sports */
  homeTeam?: string;
  awayTeam?: string;
  homeTeamAbbr?: string;
  awayTeamAbbr?: string;
  homeScore?: number;
  awayScore?: number;
  /** Set by favorites prioritization */
  favorited?: boolean;
  favoritedSide?: "home" | "away" | "both";
  /** For non-matchup sports (golf, F1, UFC, boxing) */
  headline?: string;
  venue?: string;
  broadcast?: string;
  note?: string;
  espnUrl?: string;
};

export type LeagueSection = {
  leagueId: string;
  leagueName: string;
  colors: { bg: string; text: string };
  events: SportEvent[];
  totalCount: number;
};
