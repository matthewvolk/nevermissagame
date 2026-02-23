import { describe, test, expect } from "bun:test";
import { FilePreferencesProvider } from "../../src/favorites/provider.ts";
import { EMPTY_PREFERENCES } from "../../src/favorites/types.ts";
import { resolve } from "path";
import { writeFileSync, unlinkSync, mkdirSync } from "fs";

const tmpDir = resolve(import.meta.dir, ".tmp");
mkdirSync(tmpDir, { recursive: true });

function writeTmpFile(name: string, content: string): string {
  const path = resolve(tmpDir, name);
  writeFileSync(path, content, "utf-8");
  return path;
}

describe("FilePreferencesProvider", () => {
  test("loads valid JSON correctly", async () => {
    const path = writeTmpFile(
      "valid.json",
      JSON.stringify({
        favoriteLeagues: ["mlb"],
        favoriteTeams: { mlb: ["SD"] },
      }),
    );
    const provider = new FilePreferencesProvider(path);
    const prefs = await provider.getPreferences();

    expect(prefs.favoriteLeagues).toEqual(["mlb"]);
    expect(prefs.favoriteTeams).toEqual({ mlb: ["SD"] });

    unlinkSync(path);
  });

  test("returns EMPTY_PREFERENCES when file missing", async () => {
    const provider = new FilePreferencesProvider(
      resolve(tmpDir, "nonexistent.json"),
    );
    const prefs = await provider.getPreferences();

    expect(prefs).toEqual(EMPTY_PREFERENCES);
  });

  test("returns EMPTY_PREFERENCES for malformed JSON", async () => {
    const path = writeTmpFile("malformed.json", "not valid json {{{");
    const provider = new FilePreferencesProvider(path);
    const prefs = await provider.getPreferences();

    expect(prefs).toEqual(EMPTY_PREFERENCES);

    unlinkSync(path);
  });

  test("validates structure (filters non-string values)", async () => {
    const path = writeTmpFile(
      "invalid-structure.json",
      JSON.stringify({
        favoriteLeagues: [123, "mlb"],
        favoriteTeams: { mlb: ["SD"] },
      }),
    );
    const provider = new FilePreferencesProvider(path);
    const prefs = await provider.getPreferences();

    // Should reject because favoriteLeagues contains a number
    expect(prefs).toEqual(EMPTY_PREFERENCES);

    unlinkSync(path);
  });

  test("loads valid conferencePreferences", async () => {
    const path = writeTmpFile(
      "with-conf.json",
      JSON.stringify({
        favoriteLeagues: ["cfb"],
        favoriteTeams: { cfb: ["SDSU"] },
        conferencePreferences: { cfb: [1, 4, 5, 8, 17] },
      }),
    );
    const provider = new FilePreferencesProvider(path);
    const prefs = await provider.getPreferences();

    expect(prefs.conferencePreferences).toEqual({ cfb: [1, 4, 5, 8, 17] });

    unlinkSync(path);
  });

  test("accepts missing conferencePreferences (optional)", async () => {
    const path = writeTmpFile(
      "no-conf.json",
      JSON.stringify({
        favoriteLeagues: ["mlb"],
        favoriteTeams: { mlb: ["SD"] },
      }),
    );
    const provider = new FilePreferencesProvider(path);
    const prefs = await provider.getPreferences();

    expect(prefs.conferencePreferences).toBeUndefined();

    unlinkSync(path);
  });

  test("rejects conferencePreferences with non-number arrays", async () => {
    const path = writeTmpFile(
      "bad-conf.json",
      JSON.stringify({
        favoriteLeagues: ["cfb"],
        favoriteTeams: { cfb: ["SDSU"] },
        conferencePreferences: { cfb: ["ACC", "Big12"] },
      }),
    );
    const provider = new FilePreferencesProvider(path);
    const prefs = await provider.getPreferences();

    expect(prefs).toEqual(EMPTY_PREFERENCES);

    unlinkSync(path);
  });

  test("rejects conferencePreferences that is not an object", async () => {
    const path = writeTmpFile(
      "bad-conf-type.json",
      JSON.stringify({
        favoriteLeagues: ["cfb"],
        favoriteTeams: { cfb: ["SDSU"] },
        conferencePreferences: "invalid",
      }),
    );
    const provider = new FilePreferencesProvider(path);
    const prefs = await provider.getPreferences();

    expect(prefs).toEqual(EMPTY_PREFERENCES);

    unlinkSync(path);
  });
});
