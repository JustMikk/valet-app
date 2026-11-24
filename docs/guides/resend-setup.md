# Turning on email (Resend)

Email invites and invoice emails (ADR-027) go out through [Resend](https://resend.com). Until the values below are set, email is off: invites still add people, and Send marks an invoice sent without emailing it.

## 1. Verify your sending domain

In Resend, open **Domains → Add domain** and enter the domain in your sender address (for `noreply@regency.io`, that is `regency.io`). Add the DNS records Resend shows (SPF, DKIM, and optionally DMARC) at your domain registrar, then wait until the domain shows **Verified**.

Until then Resend refuses every email with "The … domain is not verified", and the app shows that message. To try email before that, use `onboarding@resend.dev` as the sender: it can send only to the email address that owns the Resend account.

## 2. Create an API key

**API Keys → Create API key**, permission **Sending access**. Copy it once (it starts with `re_`).

This is the same value Resend's SMTP page shows as the password. The app uses Resend's API, not SMTP, so `SMTP_HOST`, `SMTP_PORT` and `SMTP_USER` are not needed.

## 3. Set the variables

In Vercel (**Project → Settings → Environment Variables**, Production and Preview) and, for local testing, in `.env.local`:

| Variable         | Value                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY` | The key from step 2                                                                                   |
| `EMAIL_FROM`     | The sender, e.g. `Regency Parking Service <noreply@regency.io>`, on the verified domain               |
| `EMAIL_REPLY_TO` | Optional: the inbox that should get clients' replies, e.g. `billing@regency.io`                       |
| `APP_URL`        | The address people open the app at, e.g. `https://valet.example.com`; `http://localhost:3000` locally |

Never put the key in the code: the repository is public, and anyone with the key can send email as you.

Redeploy after changing variables. Then run `pnpm db:migrate` against the production database (migration 017 adds the invoice email list and its log).

## 4. Test

1. **Invite:** Staff → Invite → By email, with an address you can read. The sheet says "Emailed 1 invite." The email's **Get started** link opens sign-in with the address filled in.
2. **Invoice:** open a draft invoice, put your own address as Client (and another as Manager), and press **Send invoice**. The client gets it, the manager is copied, and the PDF is attached. The card then lists "Emailed … to …"; **Send again** emails it to the list once more.

If an email fails, the app shows Resend's reason (for example an unverified domain) and a draft stays a draft. Every email is also listed under **Emails** in the Resend dashboard.
