import type { LeagueSection } from "../events/types.ts";
import { renderLeagueSection } from "./sections.ts";
import {
  todayET,
  daysFromTodayET,
  formatDateRange,
} from "../utils/dates.ts";
import { LOOKAHEAD_DAYS } from "../config.ts";

function renderSectionHeader(title: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px">
      <tr>
        <td>
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#a1a1aa">${title}</p>
          <div style="height:1px;background-color:#e4e4e7;margin-top:8px"></div>
        </td>
      </tr>
    </table>`;
}

export function buildEmailHtml(
  results: LeagueSection[],
  upcoming: LeagueSection[],
  referenceDate?: Date,
): string {
  const start = referenceDate ?? todayET();
  const end = new Date(start);
  end.setDate(end.getDate() + LOOKAHEAD_DAYS);
  const dateRangeStr = formatDateRange(start, end);

  // Build results section
  const resultsSectionHtml =
    results.length > 0
      ? renderSectionHeader("Yesterday&rsquo;s Results") +
        results.map((s) => renderLeagueSection(s, true)).join("")
      : "";

  // Build upcoming section
  const upcomingSectionHtml =
    upcoming.length > 0
      ? renderSectionHeader("Upcoming Games") +
        upcoming.map((s) => renderLeagueSection(s, false)).join("")
      : "";

  // Empty state
  const emptyHtml =
    results.length === 0 && upcoming.length === 0
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px">
          <tr>
            <td style="padding:20px;text-align:center;color:#a1a1aa;font-size:14px">
              Unable to fetch sports data. Please try again tomorrow.
            </td>
          </tr>
        </table>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Never Miss a Game</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <div style="background-color:#f4f4f5;padding:20px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto">
      <!-- Header -->
      <tr>
        <td style="background-color:#09090b;padding:28px 24px;border-radius:8px 8px 0 0">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#a1a1aa">Daily Digest</p>
                <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;color:#fafafa;line-height:1.2">Never Miss a Game</h1>
              </td>
              <td style="text-align:right;vertical-align:bottom">
                <p style="margin:0;font-size:12px;color:#71717a">${dateRangeStr}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="background-color:#ffffff;padding:8px 24px 24px">
          ${upcomingSectionHtml}
          ${resultsSectionHtml}
          ${emptyHtml}

          <!-- Footer divider -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-top:20px">
                <div style="height:1px;background-color:#e4e4e7"></div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color:#ffffff;padding:0 24px 28px;border-radius:0 0 8px 8px">
          <p style="margin:0;font-size:11px;color:#a1a1aa;line-height:1.6">
            You received this because you subscribed to Never Miss a Game.<br>
            All times Eastern. Schedules subject to change.
          </p>
          <p style="margin:12px 0 0;font-size:11px;color:#a1a1aa">
            <a href="#" style="color:#71717a;text-decoration:underline">Manage preferences</a>
            <span style="margin:0 6px;color:#d4d4d8">&middot;</span>
            <a href="#" style="color:#71717a;text-decoration:underline">Unsubscribe</a>
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}
