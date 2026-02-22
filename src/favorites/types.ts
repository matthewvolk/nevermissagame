export type UserPreferences = {
  favoriteLeagues: string[];
  favoriteTeams: Record<string, string[]>;
};

export const EMPTY_PREFERENCES: UserPreferences = {
  favoriteLeagues: [],
  favoriteTeams: {},
};
