import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email } = req.body ?? {};
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }

  const normalized = email.trim().toLowerCase();

  const { error: dbError } = await supabase
    .from("broker_waitlist")
    .insert({ email: normalized });

  if (dbError && dbError.code !== "23505") {
    return res.status(500).json({ error: "DB error" });
  }

  await resend.emails.send({
    from: "Quantin <noreply@quantin.finance>",
    to: "contact@quantin.finance",
    subject: "New broker waitlist signup",
    html: `<p><strong>${normalized}</strong> just joined the broker waitlist.</p>`,
  });

  return res.status(200).json({ ok: true });
}
