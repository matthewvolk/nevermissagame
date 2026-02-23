import { Resend } from "resend";
import { createLogger } from "../utils/logger.ts";
import { todayET } from "../utils/dates.ts";

const log = createLogger("email");

export async function sendEmail(html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }

  const to = process.env.EMAIL_TO;
  if (!to) {
    throw new Error("EMAIL_TO environment variable is required");
  }

  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

  const resend = new Resend(apiKey);

  log.info(`Sending email to ${to} from ${from}`);

  const { data, error } = await resend.emails.send({
    from: `Never Miss a Game <${from}>`,
    to: to.split(",").map((e) => e.trim()),
    subject: `Never Miss a Game — ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" }).format(todayET())}`,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${JSON.stringify(error)}`);
  }

  log.info(`Email sent successfully: ${data?.id}`);
}
