import {
  ESPN_BASE_URL,
  MAX_RETRIES,
  RETRY_BASE_DELAY_MS,
  REQUEST_TIMEOUT_MS,
} from "../config.ts";
import type { ESPNScoreboardResponse } from "./types.ts";
import { createLogger } from "../utils/logger.ts";

const log = createLogger("espn-client");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchScoreboard(
  espnPath: string,
  dateRange: string,
  group?: number,
): Promise<ESPNScoreboardResponse> {
  const url = new URL(`${ESPN_BASE_URL}/${espnPath}/scoreboard`);
  url.searchParams.set("dates", dateRange);
  if (group !== undefined) {
    url.searchParams.set("groups", String(group));
  }
  // Request more results to avoid truncation
  url.searchParams.set("limit", "100");

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
        log.warn(`Retry ${attempt}/${MAX_RETRIES} after ${delay}ms for ${espnPath}`);
        await sleep(delay);
      }

      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );

      const response = await fetch(url.toString(), {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as ESPNScoreboardResponse;
      log.info(
        `Fetched ${espnPath}: ${data.events?.length ?? 0} events`,
      );
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      log.error(`Attempt ${attempt + 1} failed for ${espnPath}: ${lastError.message}`);
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${espnPath}`);
}
