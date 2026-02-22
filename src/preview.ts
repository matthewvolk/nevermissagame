import { fetchUpcomingEvents } from "./events/upcoming.ts";
import { fetchYesterdayResults } from "./events/results.ts";
import { buildEmailHtml } from "./email/template.ts";
import { createLogger } from "./utils/logger.ts";
import { writeFileSync } from "fs";
import { resolve } from "path";

const log = createLogger("preview");

async function main() {
  // Parse --date flag
  let referenceDate: Date | undefined;
  const dateIdx = process.argv.indexOf("--date");
  if (dateIdx !== -1 && process.argv[dateIdx + 1]) {
    referenceDate = new Date(process.argv[dateIdx + 1]!);
    if (isNaN(referenceDate.getTime())) {
      log.error("Invalid date format. Use YYYY-MM-DD");
      process.exit(1);
    }
    log.info(`Using reference date: ${referenceDate.toISOString()}`);
  }

  log.info("Fetching data for preview...");

  // Compute yesterday relative to reference date
  let yesterdayDate: Date | undefined;
  if (referenceDate) {
    yesterdayDate = new Date(referenceDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  }

  const [results, upcoming] = await Promise.all([
    fetchYesterdayResults(yesterdayDate),
    fetchUpcomingEvents(referenceDate),
  ]);

  log.info(
    `Fetched ${results.length} result sections, ${upcoming.length} upcoming sections`,
  );

  const html = buildEmailHtml(results, upcoming, referenceDate);

  const outPath = resolve(import.meta.dir, "..", "preview.html");
  writeFileSync(outPath, html, "utf-8");
  log.info(`Preview written to ${outPath}`);

  // Open in browser (macOS)
  const proc = Bun.spawn(["open", outPath]);
  await proc.exited;
}

main().catch((err) => {
  log.error("Fatal error", err);
  process.exit(1);
});
