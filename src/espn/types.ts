/** ESPN API scoreboard response */
export type ESPNScoreboardResponse = {
  leagues?: ESPNLeague[];
  events?: ESPNEvent[];
};

export type ESPNLeague = {
  id: string;
  name: string;
  abbreviation: string;
};

export type ESPNEvent = {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: ESPNStatus;
  competitions?: ESPNCompetition[];
  links?: ESPNLink[];
  /** Golf/Racing: tournament-level data */
  season?: { year: number };
};

export type ESPNStatus = {
  type: {
    id: string;
    name: string;
    state: "pre" | "in" | "post";
    completed: boolean;
    description: string;
    detail?: string;
    shortDetail?: string;
  };
};

export type ESPNCompetition = {
  id: string;
  date: string;
  venue?: ESPNVenue;
  competitors?: ESPNCompetitor[];
  broadcasts?: ESPNBroadcast[];
  notes?: ESPNNote[];
  status?: ESPNStatus;
};

export type ESPNVenue = {
  fullName: string;
  city?: string;
  state?: string;
};

export type ESPNCompetitor = {
  id: string;
  homeAway?: "home" | "away";
  order?: number;
  team?: {
    displayName: string;
    shortDisplayName: string;
    abbreviation: string;
    logo?: string;
  };
  athlete?: {
    displayName: string;
  };
  score?: string;
  winner?: boolean;
  records?: Array<{
    type: string;
    summary: string;
  }>;
  linescores?: Array<{
    value: number;
    displayValue: string;
    period: number;
  }>;
};

export type ESPNBroadcast = {
  names?: string[];
  market?: { type: string };
};

export type ESPNNote = {
  headline?: string;
  type?: string;
};

export type ESPNLink = {
  href: string;
  rel?: string[];
  text?: string;
};
