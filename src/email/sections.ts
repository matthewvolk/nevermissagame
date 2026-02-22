import type { LeagueSection, SportEvent } from "../events/types.ts";
import { formatDateDisplay, formatTimeDisplay, isToday } from "../utils/dates.ts";

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

  const star = `<span style="color:#EFC54D;font-size:11px">&#9733;</span>`;
  const awayStarred = event.favorited && (event.favoritedSide === "away" || event.favoritedSide === "both");
  const homeStarred = event.favorited && (event.favoritedSide === "home" || event.favoritedSide === "both");

  // Right side: date/time or FINAL
  let rightHtml: string;
  if (isResult) {
    rightHtml = `
      <p style="margin:0;font-size:12px;color:#52525b;line-height:1.4">${escapeHtml(dateStr)}</p>
      <p style="margin:1px 0 0;font-size:11px;font-weight:600;color:#c9500e;text-transform:uppercase;letter-spacing:0.04em">FINAL</p>`;
  } else {
    const today = isToday(event.date);
    const dateLabel = today ? "Today" : escapeHtml(dateStr);
    const dateColor = today ? "#c9500e" : "#52525b";
    const dateWeight = today ? "font-weight:700;" : "";
    const timeColor = today ? "#c9500e" : "#a1a1aa";
    const timeWeight = today ? "font-weight:700;" : "";
    const broadcastHtml = event.broadcast
      ? `<span style="margin:0 4px;color:#d4d4d8">&middot;</span>${escapeHtml(event.broadcast)}`
      : "";
    rightHtml = `
      <p style="margin:0;font-size:12px;color:${dateColor};${dateWeight}line-height:1.4">${dateLabel}</p>
      <p style="margin:1px 0 0;font-size:12px;color:${timeColor};${timeWeight}">${escapeHtml(timeStr)}${broadcastHtml}</p>`;
  }

  // Leaderboard events (golf tournaments)
  if (event.leaderboard && event.leaderboard.length > 0) {
    const hasToday = event.leaderboard.some((e) => e.today);

    // Status label
    let statusLabel: string;
    let statusColor: string;
    if (event.status === "completed") {
      statusLabel = "FINAL";
      statusColor = "#c9500e";
    } else {
      statusLabel = event.statusDetail
        ? escapeHtml(event.statusDetail).toUpperCase()
        : "IN PROGRESS";
      statusColor = "#2563eb";
    }

    // Build leaderboard rows
    const leaderboardRows = event.leaderboard
      .map((entry, i) => {
        const bg = i % 2 === 0 ? "#fafafa" : "#ffffff";
        const bold = i < 3 ? "font-weight:600;" : "";

        // Show "T" prefix when position matches adjacent entry
        const prevSamePos =
          i > 0 && event.leaderboard![i - 1]!.position === entry.position;
        const nextSamePos =
          i < event.leaderboard!.length - 1 &&
          event.leaderboard![i + 1]!.position === entry.position;
        const isTied = prevSamePos || nextSamePos;
        const posStr = isTied ? `T${entry.position}` : `${entry.position}`;

        const todayCell = hasToday
          ? `<td style="padding:3px 8px;font-size:12px;${bold}color:#52525b;text-align:right">${entry.today ? escapeHtml(entry.today) : ""}</td>`
          : "";

        return `<tr style="background-color:${bg}">
          <td style="padding:3px 8px;font-size:12px;${bold}color:#52525b;text-align:right;width:32px">${posStr}</td>
          <td style="padding:3px 8px;font-size:12px;${bold}color:#18181b">${escapeHtml(entry.name)}</td>
          <td style="padding:3px 8px;font-size:12px;${bold}color:#18181b;text-align:right">${escapeHtml(entry.score)}</td>
          ${todayCell}
        </tr>`;
      })
      .join("");

    const todayHeader = hasToday
      ? `<th style="padding:3px 8px;font-size:11px;font-weight:600;color:#a1a1aa;text-align:right;text-transform:uppercase">Today</th>`
      : "";

    return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:${isLast ? "none" : "1px solid #f4f4f5"}">
      <tr>
        <td style="width:3px;background-color:${borderColor};border-radius:2px"></td>
        <td style="padding:12px 14px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:top">
                <p style="margin:0;font-size:14px;font-weight:600;color:#18181b;line-height:1.4">${escapeHtml(event.headline || event.name)}</p>
              </td>
              <td style="text-align:right;vertical-align:top;white-space:nowrap">
                <p style="margin:0;font-size:12px;color:#52525b;line-height:1.4">${escapeHtml(dateStr)}</p>
                <p style="margin:1px 0 0;font-size:11px;font-weight:600;color:${statusColor};text-transform:uppercase;letter-spacing:0.04em">${statusLabel}</p>
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;border:1px solid #e4e4e7;border-radius:4px;border-collapse:separate">
            <tr style="border-bottom:1px solid #e4e4e7">
              <th style="padding:3px 8px;font-size:11px;font-weight:600;color:#a1a1aa;text-align:right;text-transform:uppercase;width:32px">Pos</th>
              <th style="padding:3px 8px;font-size:11px;font-weight:600;color:#a1a1aa;text-align:left;text-transform:uppercase">Player</th>
              <th style="padding:3px 8px;font-size:11px;font-weight:600;color:#a1a1aa;text-align:right;text-transform:uppercase">Score</th>
              ${todayHeader}
            </tr>
            ${leaderboardRows}
          </table>
        </td>
      </tr>
    </table>`;
  }

  // Two-team events: stacked layout
  if (event.awayTeam && event.homeTeam) {
    // Build per-team line content
    let awayLineHtml: string;
    let homeLineHtml: string;

    if (isResult && event.awayScore !== undefined && event.homeScore !== undefined) {
      let awayIndicator: string;
      let homeIndicator: string;
      let awayWeight: number;
      let homeWeight: number;
      if (event.awayScore > event.homeScore) {
        awayIndicator = `<span style="color:#16a34a;font-weight:700;margin-left:4px;font-size:12px">W</span>`;
        homeIndicator = `<span style="color:#dc2626;font-weight:700;margin-left:4px;font-size:12px">L</span>`;
        awayWeight = 600;
        homeWeight = 400;
      } else if (event.homeScore > event.awayScore) {
        awayIndicator = `<span style="color:#dc2626;font-weight:700;margin-left:4px;font-size:12px">L</span>`;
        homeIndicator = `<span style="color:#16a34a;font-weight:700;margin-left:4px;font-size:12px">W</span>`;
        awayWeight = 400;
        homeWeight = 600;
      } else {
        awayIndicator = `<span style="color:#a1a1aa;font-weight:700;margin-left:4px;font-size:12px">T</span>`;
        homeIndicator = `<span style="color:#a1a1aa;font-weight:700;margin-left:4px;font-size:12px">T</span>`;
        awayWeight = 400;
        homeWeight = 400;
      }
      const awayRecord = event.awayRecord ? `<span style="color:#a1a1aa;font-size:11px;font-weight:400;margin-left:4px">(${escapeHtml(event.awayRecord)})</span>` : "";
      const homeRecord = event.homeRecord ? `<span style="color:#a1a1aa;font-size:11px;font-weight:400;margin-left:4px">(${escapeHtml(event.homeRecord)})</span>` : "";
      awayLineHtml = `<span style="font-weight:${awayWeight};color:#18181b">${escapeHtml(event.awayTeam)} ${event.awayScore}</span>${awayIndicator}${awayRecord}`;
      homeLineHtml = `<span style="font-weight:${homeWeight};color:#18181b">${escapeHtml(event.homeTeam)} ${event.homeScore}</span>${homeIndicator}${homeRecord}`;
    } else {
      const awayRecord = event.awayRecord ? `<span style="color:#a1a1aa;font-size:11px;font-weight:400;margin-left:4px">(${escapeHtml(event.awayRecord)})</span>` : "";
      const homeRecord = event.homeRecord ? `<span style="color:#a1a1aa;font-size:11px;font-weight:400;margin-left:4px">(${escapeHtml(event.homeRecord)})</span>` : "";
      awayLineHtml = `<span style="font-weight:600;color:#18181b">${escapeHtml(event.awayTeam)}</span>${awayRecord}`;
      homeLineHtml = `<span style="font-weight:600;color:#18181b">${escapeHtml(event.homeTeam)}</span>${homeRecord}`;
    }

    const noteRow = event.note
      ? `<tr>
          <td colspan="2" style="vertical-align:top">
            <p style="margin:2px 0 0;font-size:11px;font-weight:600;color:#c9500e;text-transform:uppercase;letter-spacing:0.04em">${escapeHtml(event.note)}</p>
          </td>
        </tr>`
      : "";

    return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:${isLast ? "none" : "1px solid #f4f4f5"}">
      <tr>
        <td style="width:3px;background-color:${borderColor};border-radius:2px"></td>
        <td style="padding:12px 14px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:18px;vertical-align:top">${awayStarred ? star : ""}</td>
              <td style="vertical-align:top">
                <p style="margin:0;font-size:14px;line-height:1.4">${awayLineHtml}</p>
              </td>
              <td style="text-align:right;vertical-align:top;white-space:nowrap" rowspan="2">
                ${rightHtml}
              </td>
            </tr>
            <tr>
              <td style="width:18px;vertical-align:top">${homeStarred ? star : ""}</td>
              <td style="vertical-align:top">
                <p style="margin:0;font-size:14px;line-height:1.4">${homeLineHtml}</p>
              </td>
            </tr>
            ${noteRow}
          </table>
        </td>
      </tr>
    </table>`;
  }

  // Headline or fallback: single-line layout
  let matchupHtml: string;
  if (event.headline) {
    const headlineStar = event.favorited ? star : "";
    matchupHtml = `${headlineStar}<span style="font-weight:600;color:#18181b">${escapeHtml(event.headline)}</span>`;
  } else {
    const fallbackStar = event.favorited ? star : "";
    matchupHtml = `${fallbackStar}<span style="font-weight:600;color:#18181b">${escapeHtml(event.name)}</span>`;
  }

  const noteHtml = event.note
    ? `<p style="margin:2px 0 0;font-size:11px;font-weight:600;color:#c9500e;text-transform:uppercase;letter-spacing:0.04em">${escapeHtml(event.note)}</p>`
    : "";

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
