# Twilio setup for texts and shift reminders

What to collect from Twilio, where to put it, and how to check it works. Decisions are in ADR-026 and `docs/specs/sms.md`.

Twilio's console menu names change from time to time. If a path below doesn't match, search the console for the item's name.

## 1. Collect five values from the Twilio Console

| Value          | Looks like            | Where                                                                                                                            |
| -------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Account SID    | `AC…` (34 characters) | Console home, **Account Info**                                                                                                   |
| Auth Token     | 32 characters         | Console home, **Account Info** (click to reveal)                                                                                 |
| API key SID    | `SK…`                 | **Account → API keys & tokens → Create API key**. Choose **Standard**, or **Restricted** with only permission to create messages |
| API key secret | shown **once**        | Same screen, right after you create the key. Copy it now                                                                         |
| Sender         | `MG…` **or** `+1…`    | See step 2                                                                                                                       |

Why both an API key and the Auth Token:

- the app **sends** with the API key, which can be revoked on its own;
- the Auth Token is only used to **check** that delivery updates really come from Twilio.

## 2. Choose the sender: a Messaging Service (recommended) or a single number

**Messaging Service.** Go to **Messaging → Services**, open the service that holds your registered number, and copy its **Messaging Service SID** (`MG…`). In that service:

- **Sender Pool:** your registered number is listed.
- **Opt-Out Management:** turn on **Advanced Opt-Out**, so STOP, HELP and START are handled for you.
- **Integration → incoming messages:** leave as is. The app doesn't read replies; delivery updates are requested per message.

**Single number** (if you don't use a service): copy the number in `+1…` form from **Phone Numbers → Manage → Active numbers**.

## 3. Check the number is cleared to text US phones

Carriers block unregistered application texts.

- **10-digit local number:** **Messaging → Regulatory Compliance → A2P 10DLC**. The brand and the campaign must both be **Approved**, and the campaign linked to your Messaging Service. The use case should cover account notifications.
- **Toll-free number:** **Phone Numbers → Regulatory Compliance → Toll-free verifications** must show **Verified**.

## 4. Pick the app's public URL and a cron secret

- **`APP_URL`:** the address people open the app at, e.g. `https://valet.example.com`, with no trailing slash. Text links and Twilio's delivery updates use it.
- **`CRON_SECRET`:** any long random string. To make one, run:

  ```bash
  node -p "require('crypto').randomBytes(32).toString('hex')"
  ```

## 5. Set the variables

Set these on Vercel (**Project → Settings → Environment Variables**, Production) and in your local `.env`, then redeploy:

```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_API_KEY_SID=SK...
TWILIO_API_KEY_SECRET=...
TWILIO_AUTH_TOKEN=...
TWILIO_MESSAGING_SERVICE_SID=MG...   # or, instead: TWILIO_FROM_NUMBER=+1713...
APP_URL=https://valet.example.com
CRON_SECRET=...
```

- Never put these in the code or in a `NEXT_PUBLIC_` variable.
- With any one missing, texts stay off and the app keeps working.
- **Settings → Clock-in rules → Text messages** shows "On · from …" once they're right.

## 6. Create the reminder cron job (cron-job.org or any scheduler)

| Field    | Value                                       |
| -------- | ------------------------------------------- |
| URL      | `https://<your APP_URL>/api/cron/reminders` |
| Method   | `GET`                                       |
| Schedule | every 5 minutes                             |
| Header   | `Authorization: Bearer <your CRON_SECRET>`  |

A successful run answers `{"sent": N}`. Wrong or missing secret gets 401.

## 7. Test with your own phone

Test on the deployed app, so Twilio's delivery updates can reach it. Each check maps to a spec success criterion (SC).

| Check       | Do this                                                                | Expect                                                                                                    |
| ----------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Setup       | Settings                                                               | "Text messages: On · from …" (SC 5)                                                                       |
| Invite      | Staff → Add staff → By phone, your name and number                     | A text with a link that opens sign-in with your number filled in; the sheet says "Texted 1 invite" (SC 1) |
| Assigned    | Assign yourself to a published event                                   | "You're assigned to …" (SC 3)                                                                             |
| Rescheduled | Change that event's start time                                         | "… has a new time: …"; a name-only edit sends nothing (SC 3)                                              |
| Removed     | Live Board → remove yourself from the slot                             | "You were removed from …" (SC 3)                                                                          |
| Cancelled   | Assign yourself again, then cancel the event                           | "Your shift at … was cancelled" (SC 3)                                                                    |
| Reminder    | Assign yourself to a shift starting in about 65 minutes                | The 1 h reminder within 5 minutes of the mark; a second cron run sends nothing more (SC 2, 4)             |
| Publish     | Save a new event as a draft with yourself assigned, then Publish event | The assigned text, and open spots posted (SC 9)                                                           |
| STOP        | Reply STOP to a text, then trigger another                             | No text; your person page shows "Opted out (replied STOP)". Reply START to re-enable (SC 6)               |
| Delivery    | The texts above                                                        | Delivered within a minute or two. Twilio's **Monitor → Logs → Messaging** shows each one                  |

If a text doesn't arrive, check **Monitor → Logs → Messaging** for the error. The most common errors are 30034 (campaign not registered) and 21610 (opted out).
