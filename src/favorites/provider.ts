import { type UserPreferences, EMPTY_PREFERENCES } from "./types.ts";
import { createLogger } from "../utils/logger.ts";

const log = createLogger("preferences");

export interface PreferencesProvider {
  getPreferences(userId?: string): Promise<UserPreferences>;
}

function isValidPreferences(data: unknown): data is UserPreferences {
  if (typeof data !== "object" || data === null) return false;

  const obj = data as Record<string, unknown>;

  if (!Array.isArray(obj.favoriteLeagues)) return false;
  if (!obj.favoriteLeagues.every((v: unknown) => typeof v === "string"))
    return false;

  if (typeof obj.favoriteTeams !== "object" || obj.favoriteTeams === null)
    return false;

  const teams = obj.favoriteTeams as Record<string, unknown>;
  for (const values of Object.values(teams)) {
    if (!Array.isArray(values)) return false;
    if (!values.every((v: unknown) => typeof v === "string")) return false;
  }

  return true;
}

export class FilePreferencesProvider implements PreferencesProvider {
  constructor(private filePath: string) {}

  async getPreferences(): Promise<UserPreferences> {
    try {
      const file = Bun.file(this.filePath);
      if (!(await file.exists())) {
        log.info("No preferences file found, using defaults");
        return EMPTY_PREFERENCES;
      }

      const data: unknown = await file.json();

      if (!isValidPreferences(data)) {
        log.warn("Malformed preferences file, using defaults");
        return EMPTY_PREFERENCES;
      }

      return data;
    } catch (err) {
      log.warn(`Failed to load preferences: ${err}`);
      return EMPTY_PREFERENCES;
    }
  }
}

export function createDefaultProvider(): PreferencesProvider {
  return new FilePreferencesProvider(
    new URL("../../favorites.json", import.meta.url).pathname,
  );
}
