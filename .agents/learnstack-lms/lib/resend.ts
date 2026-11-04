import { Resend } from "resend";
import { env } from "./env";

export const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface ResendEmailResponse {
  to: string;
  subject: string;
  text: string;
}

export async function sendEmail({ to, subject, text }: ResendEmailResponse) {
  if (!resend || env.RESEND_API_KEY.includes("dummy")) {
    console.log(`[DEV EMAIL MOCK] To: ${to} | Subject: ${subject} | Content: ${text}`);
    return;
  }
  await resend.emails.send({
    from: "SADITA.ai <onboarding@resend.dev>",
    to,
    subject,
    text,
  });
}
