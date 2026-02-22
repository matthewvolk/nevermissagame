import { Resend } from "resend";
import { createLogger } from "../utils/logger.ts";

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
    from: `Sports Forecast <${from}>`,
    to: to.split(",").map((e) => e.trim()),
    subject: "Your Daily Sports Forecast",
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${JSON.stringify(error)}`);
  }

  log.info(`Email sent successfully: ${data?.id}`);
}
