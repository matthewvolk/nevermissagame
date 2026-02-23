export type UserPreferences = {
  favoriteLeagues: string[];
  favoriteTeams: Record<string, string[]>;
  conferencePreferences?: Record<string, number[]>;
};

export const EMPTY_PREFERENCES: UserPreferences = {
  favoriteLeagues: [],
  favoriteTeams: {},
};
