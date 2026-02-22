import { fetchUpcomingEvents } from "./events/upcoming.ts";
import { fetchYesterdayResults } from "./events/results.ts";
import { buildEmailHtml } from "./email/template.ts";
import { sendEmail } from "./email/send.ts";
import { createLogger } from "./utils/logger.ts";

const log = createLogger("main");

async function main() {
  log.info("Starting Sports Forecast email generation");

  const [results, upcoming] = await Promise.all([
    fetchYesterdayResults(),
    fetchUpcomingEvents(),
  ]);

  log.info(
    `Fetched ${results.length} result sections, ${upcoming.length} upcoming sections`,
  );

  const html = buildEmailHtml(results, upcoming);

  await sendEmail(html);
  log.info("Done!");
}

main().catch((err) => {
  log.error("Fatal error", err);
  process.exit(1);
});
