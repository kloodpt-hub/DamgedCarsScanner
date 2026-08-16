import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.FROM_EMAIL;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const client = getResendClient();
  if (!client) {
    console.warn("[email] Resend not configured, skipping email");
    return false;
  }

  try {
    const from = process.env.FROM_EMAIL || "noreply@damagedcarscanner.com";
    await client.emails.send({ from, to, subject, html });
    return true;
  } catch (err) {
    console.error("[email] Failed to send:", err);
    return false;
  }
}

export async function sendListingAlert(
  user: { email: string; name?: string | null },
  listing: {
    title: string;
    price: number | null;
    year: number | null;
    mileage: number | null;
    damageStatus: string | null;
    canonicalUrl: string;
    imageUrl: string | null;
    source: { name: string } | null;
  },
  filter: { name: string }
): Promise<boolean> {
  const subject = `New listing: ${listing.title}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1a1a2e;">🚗 New Car Deal Found</h2>
      <p>Hi ${user.name || "there"},</p>
      <p>A new listing matches your filter <strong>"${filter.name}"</strong>:</p>
      <div style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:16px 0;">
        ${listing.imageUrl ? `<img src="${listing.imageUrl}" alt="" style="width:100%;max-height:300px;object-fit:cover;" />` : ""}
        <div style="padding:16px;">
          <h3 style="margin:0 0 8px;"><a href="${listing.canonicalUrl}" style="color:#1a1a2e;text-decoration:none;">${listing.title}</a></h3>
          <table style="width:100%;font-size:14px;color:#555;">
            <tr><td><strong>Price</strong></td><td>${listing.price != null ? `${listing.price.toLocaleString()} €` : "N/A"}</td></tr>
            <tr><td><strong>Year</strong></td><td>${listing.year ?? "N/A"}</td></tr>
            <tr><td><strong>Mileage</strong></td><td>${listing.mileage != null ? `${listing.mileage.toLocaleString()} km` : "N/A"}</td></tr>
            <tr><td><strong>Damage</strong></td><td>${listing.damageStatus ?? "N/A"}</td></tr>
            <tr><td><strong>Source</strong></td><td>${listing.source?.name ?? "(Deleted)"}</td></tr>
          </table>
          <a href="${listing.canonicalUrl}" style="display:inline-block;margin-top:12px;padding:10px 20px;background:#6c5ce7;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;">View Listing →</a>
        </div>
      </div>
    </div>`;

  return sendEmail({ to: user.email, subject, html });
}

export async function sendDigestEmail(
  user: { email: string; name?: string | null },
  listings: {
    title: string;
    price: number | null;
    canonicalUrl: string;
    source: { name: string } | null;
  }[]
): Promise<boolean> {
  const subject = `Car Deals Hunter: ${listings.length} new listing(s) today`;
  const rows = listings
    .map(
      (l) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">
          <a href="${l.canonicalUrl}" style="color:#1a1a2e;text-decoration:none;">${l.title}</a>
        </td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${l.price != null ? `${l.price.toLocaleString()} €` : "N/A"}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${l.source?.name ?? "(Deleted)"}</td>
      </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1a1a2e;">📋 Daily Digest</h2>
      <p>Hi ${user.name || "there"},</p>
      <p>Here are today's new listings:</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr style="background:#f3f4f6;"><th style="padding:8px;text-align:left;">Listing</th><th style="padding:8px;text-align:right;">Price</th><th style="padding:8px;">Source</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  return sendEmail({ to: user.email, subject, html });
}

export async function sendTestEmail(to: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: "Test Email from Car Deals Hunter",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#6c5ce7;">✅ Email Notifications Working!</h2>
        <p>You will receive alerts when new listings match your filters.</p>
      </div>
    `,
  });
}
