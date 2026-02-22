import type { LeagueSection, SportEvent } from "../events/types.ts";
import { formatDateDisplay, formatTimeDisplay } from "../utils/dates.ts";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderGameRow(
  event: SportEvent,
  isLast: boolean,
  borderColor: string,
  isResult: boolean,
): string {
  const dateStr = formatDateDisplay(event.date);
  const timeStr = formatTimeDisplay(event.date);

  // Build matchup text
  const star = `<span style="color:#EFC54D;margin:0 3px">&#9733;</span>`;
  const awayStarred = event.favorited && (event.favoritedSide === "away" || event.favoritedSide === "both");
  const homeStarred = event.favorited && (event.favoritedSide === "home" || event.favoritedSide === "both");
  let matchupHtml: string;
  if (event.awayTeam && event.homeTeam) {
    const awayStar = awayStarred ? star : "";
    const homeStar = homeStarred ? star : "";
    if (isResult && event.awayScore !== undefined && event.homeScore !== undefined) {
      // Show scores for results
      matchupHtml = `${awayStar}<span style="font-weight:600;color:#18181b">${escapeHtml(event.awayTeam)} ${event.awayScore}</span> <span style="color:#a1a1aa;font-weight:400;margin:0 6px">@</span> ${homeStar}<span style="font-weight:600;color:#18181b">${escapeHtml(event.homeTeam)} ${event.homeScore}</span>`;
    } else {
      matchupHtml = `${awayStar}<span style="font-weight:600;color:#18181b">${escapeHtml(event.awayTeam)}</span> <span style="color:#a1a1aa;font-weight:400;margin:0 6px">@</span> ${homeStar}<span style="font-weight:600;color:#18181b">${escapeHtml(event.homeTeam)}</span>`;
    }
  } else if (event.headline) {
    const headlineStar = event.favorited ? star : "";
    matchupHtml = `${headlineStar}<span style="font-weight:600;color:#18181b">${escapeHtml(event.headline)}</span>`;
  } else {
    const fallbackStar = event.favorited ? star : "";
    matchupHtml = `${fallbackStar}<span style="font-weight:600;color:#18181b">${escapeHtml(event.name)}</span>`;
  }

  // Note line
  const noteHtml = event.note
    ? `<p style="margin:2px 0 0;font-size:11px;font-weight:600;color:#c9500e;text-transform:uppercase;letter-spacing:0.04em">${escapeHtml(event.note)}</p>`
    : "";

  // Right side: date/time or FINAL
  let rightHtml: string;
  if (isResult) {
    rightHtml = `
      <p style="margin:0;font-size:12px;color:#52525b;line-height:1.4">${escapeHtml(dateStr)}</p>
      <p style="margin:1px 0 0;font-size:11px;font-weight:600;color:#c9500e;text-transform:uppercase;letter-spacing:0.04em">FINAL</p>`;
  } else {
    const broadcastHtml = event.broadcast
      ? `<span style="margin:0 4px;color:#d4d4d8">&middot;</span>${escapeHtml(event.broadcast)}`
      : "";
    rightHtml = `
      <p style="margin:0;font-size:12px;color:#52525b;line-height:1.4">${escapeHtml(dateStr)}</p>
      <p style="margin:1px 0 0;font-size:12px;color:#a1a1aa">${escapeHtml(timeStr)}${broadcastHtml}</p>`;
  }

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:${isLast ? "none" : "1px solid #f4f4f5"}">
      <tr>
        <td style="width:3px;background-color:${borderColor};border-radius:2px"></td>
        <td style="padding:12px 14px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:top">
                <p style="margin:0;font-size:14px;line-height:1.4">${matchupHtml}</p>
                ${noteHtml}
              </td>
              <td style="text-align:right;vertical-align:top;white-space:nowrap">
                ${rightHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

export function renderLeagueSection(
  section: LeagueSection,
  isResult: boolean,
): string {
  const { colors, events, totalCount, leagueName } = section;
  const count = events.length;
  const overflow = totalCount - count;

  const gameCountLabel =
    count === 1
      ? `1 ${isResult ? "result" : "game"}`
      : `${count} ${isResult ? "results" : "games"}`;

  const gameRows = events
    .map((event, i) =>
      renderGameRow(event, i === events.length - 1 && overflow <= 0, colors.bg, isResult),
    )
    .join("");

  const overflowHtml =
    overflow > 0
      ? `<tr><td style="padding:8px 14px 4px;font-size:12px;color:#a1a1aa">+ ${overflow} more</td></tr>`
      : "";

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px">
      <tr>
        <td>
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background-color:${colors.bg};color:${colors.text};font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:5px 10px;border-radius:4px;line-height:1">${escapeHtml(leagueName)}</td>
              <td style="padding-left:10px;font-size:12px;color:#a1a1aa">${gameCountLabel}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-top:10px">
          ${gameRows}
        </td>
      </tr>
      ${overflowHtml}
    </table>`;
}
