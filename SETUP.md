# Clinic Diary: cloud and clinic line setup

Live app: https://nirajkdas.github.io/clinic-diary/

The app works on its own (data on the phone). These steps add:
- **Cloud**: login, data saved online, same data on every device.
- **Clinic line**: clinic calls show up in the app by themselves, with a notification after each call.

```
Google Ads call ──► Edesy virtual number ──► rings Doctor's phone (shows patient's number)
                           │ after every call (answered or not): signed webhook
                           ▼
            Supabase function "call-webhook" ── saves call, makes a lead if missed ──► push notification
                           │
                           ▼
                 App: Calls tab (label each answered call in one tap)

Missed call on the clinic Jio number ──(*403 / *405 forwarding)──► same Edesy number ──► same webhook
```

## 1. Supabase (Niraj, about 5 minutes, one time)

1. Sign up at https://supabase.com and create a project (region **Mumbai**, free plan). Note the **project ref**:
   the part of the project URL like `abcdefghijklmnop`.
2. Create an access token at https://supabase.com/dashboard/account/tokens.
3. In this GitHub repo, open **Settings → Secrets and variables → Actions**:
   - **Secrets** tab → New secret: `SUPABASE_ACCESS_TOKEN` = the token.
   - **Variables** tab → New variable: `SUPABASE_PROJECT_REF` = the project ref.
4. Open **Actions → Deploy backend → Run workflow**.

The workflow creates the tables and security rules, sets up code-based login emails, deploys the server functions,
and writes `config.js` so the live app connects to the project. Re-running it is safe.

## 2. Doctor's phone (2 minutes)

1. Open the app link in **Safari** → Share → **Add to Home Screen**. Open it from the icon.
2. Settings → **Cloud and clinic line** → enter email → type the 6-digit code from the email.
   (First sign-in on a phone with real data uploads it. Sample data is dropped.)
3. Tap **Turn on notifications** and allow.

## 3. Edesy clinic line (recommended, about ₹499/month + ₹1/min talk time + GST)

Facts from Edesy's own docs (checked 22 Nov 2026):
- Mobile or 92-series number rental ₹499/month, landline ₹449. No setup fee. Prepaid wallet.
- Talk time ₹1.00 per connected minute, 60-second pulses, 1-minute minimum. 18% GST on top.
- Unanswered calls are not billed with the default "connect on pickup" setting. **Keep hold audio off.**
- Forwarded calls show the virtual number by default. Set **"Caller ID shown to answering phone" → Original caller**
  (some networks may still show the virtual number; the app's notification always shows who it was).
- After every call, answered or not, a signed webhook is sent with caller, status and duration.
  There is no "ringing" event, so notifications come after the call ends.

Steps:
1. Doctor signs up at https://voice-app.edesy.in, completes KYC with clinic documents, buys one **mobile** number,
   and adds wallet balance.
2. Forwarding rule on that number: ring her mobile, **Caller ID → Original caller**, hold audio **off**.
3. **Webhooks → Add subscription**: paste the **Webhook URL** and **Signing secret** from the app
   (Settings → Cloud and clinic line → Call provider settings). Leave event types empty. Press **Test**.
4. Put the Edesy number on the Google Ads call ad. Keep WhatsApp on the clinic number as it is.
5. On the clinic Jio SIM, send missed calls to the Edesy number:
   - no answer: dial `*403*<Edesy number 10 digits>`  (turn off: `*404`)
   - busy: dial `*405*<Edesy number 10 digits>`  (turn off: `*406`)
   - Turn **Call Waiting off** on the clinic SIM.

Answered calls on the clinic number itself don't pass through Edesy (that keeps the bill low).
She logs those with **Calls → + Log a call**.

## 3b. Exotel (alternative)

Call flow: **Greeting → Passthru** (*When a call starts* URL) **→ Connect** (her phone; after the call and when
nobody answers, go on) **→ Passthru** (*When a call ends* URL) **→ Hangup**. Both URLs are in the app.
Exotel also gives a "ringing" notification before she picks up.

## Test before going live

1. Call the Edesy number from another phone and answer.
   After hanging up: "Talked to … (1 min). What happened?" and the call is under **Calls → Label these calls**.
2. Call again and don't answer: "Missed call: …" and a **New** lead in Calls.
3. Call the clinic Jio number and don't answer: it should forward to Edesy and show up as a missed call.
4. Note which number shows on her screen while it rings.

## Where things live

| Part | File |
|---|---|
| App (screens, logic, cloud sync) | `index.html`, `app.js`, `sw.js` |
| Cloud connection (public values) | `config.js` |
| Database tables + security rules | `supabase/migrations/001_init.sql` |
| Call webhook (Edesy + Exotel) | `supabase/functions/call-webhook/index.ts` |
| Call rules, parsing, signatures (tested) | `supabase/functions/_shared/calls.ts`, `webhook.ts`, `*_test.ts` |
| Notifications | `supabase/functions/_shared/push.ts`, `push-key/index.ts` |
| Deploy | `.github/workflows/backend.yml` |

Run server tests: `cd supabase/functions && deno test _shared/`
