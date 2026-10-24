import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, email, role, message } = req.body ?? {};
  if (!name || !email || !role) return res.status(400).json({ error: "Missing fields" });

  await resend.emails.send({
    from: "Quantin <noreply@quantin.finance>",
    to: "contact@quantin.finance",
    subject: `Job application — ${role}`,
    html: `
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Role:</strong> ${role}</p>
      <p><strong>Message:</strong><br/>${message ?? "—"}</p>
    `,
  });

  return res.status(200).json({ ok: true });
}
