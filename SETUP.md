# Clinic Diary: cloud and clinic line setup

Live app: https://nirajkdas.github.io/clinic-diary/

The app works on its own (data on the phone). These steps add:
- **Cloud**: login, data saved online, same data on every device.
- **Clinic line**: every clinic call, answered or missed, shows up in the app by itself, with a notification.

```
Patient calls clinic number (Jio)
      │  all calls forwarded (*401*)
      ▼
Exotel virtual number ── Greeting ─► Passthru (start) ─► Connect: rings Doctor's personal phone ─► Passthru (end)
                                         │                                                         │
                                         ▼                                                         ▼
                           Supabase function "exotel"  ── saves call, makes lead if missed ──► push notification
                                         │
                                         ▼
                               App: Calls tab (label each call in one tap)
```

## 1. Supabase (Niraj, about 5 minutes, one time)

1. Sign up at https://supabase.com and create a project (region **Mumbai**, free plan). Note the **project ref**: the part of the project URL like `abcdefghijklmnop`.
2. Create an access token at https://supabase.com/dashboard/account/tokens.
3. In this GitHub repo, open **Settings → Secrets and variables → Actions**:
   - **Secrets** tab → New secret: `SUPABASE_ACCESS_TOKEN` = the token.
   - **Variables** tab → New variable: `SUPABASE_PROJECT_REF` = the project ref.
4. Open **Actions → Deploy backend → Run workflow**.

The workflow creates the tables and security rules, sets up code-based login emails, deploys the two server functions,
and writes `config.js` so the live app connects to the project. Re-running it is safe.

## 2. Doctor's phone (2 minutes)

1. Open the app link in **Safari** → Share → **Add to Home Screen**. Open it from the icon.
2. Settings → **Cloud and clinic line** → enter email → type the 6-digit code from the email.
   (First sign-in on a phone with real data uploads it. Sample data is dropped.)
3. Tap **Turn on notifications** and allow.
4. In **Clinic line rings this number**, enter her personal number and Save.

## 3. Exotel (Doctor does KYC; anyone can build the flow)

1. Sign up at https://exotel.com, complete KYC with clinic documents, get an **ExoPhone** (virtual number).
2. Create a call flow (App Bazaar → new app):
   1. **Greeting**: "Namaste, Smile Dental Clinic. Yeh call record ki ja sakti hai." (needed if recording is on)
   2. **Passthru**: URL = *Passthru when a call starts* from the app (Settings → Exotel settings → Copy).
   3. **Connect**: dial her personal number, recording on. After the conversation ends, and if nobody answers, go to step 4.
   4. **Passthru**: URL = *Passthru when a call ends*.
   5. **Hangup**.
3. Attach the flow to the ExoPhone.

## 4. Jio forwarding (on the clinic SIM)

- Turn on: dial `*401*<ExoPhone 10 digits>` from the clinic SIM.
- Turn off any time: dial `*402`. Everything goes back to normal immediately.
- Turn **Call Waiting off** on the clinic SIM.

## Test before going live

1. From another phone, call the clinic number and answer on her phone.
   - A notification "Incoming: …" should arrive while it rings.
   - After hanging up: "Talked to … (1 min). What happened?" and the call appears under **Calls → Label these calls**.
2. Call again and do not answer.
   - "Missed call: …" notification, and a **New** lead in Calls.
3. Check what number shows on her screen when Exotel rings her. If it shows the ExoPhone instead of the patient,
   the "Incoming" notification is how she sees who is calling.
4. Check with Jio whether forwarded minutes are charged on the clinic SIM's plan.

## Where things live

| Part | File |
|---|---|
| App (screens, logic, cloud sync) | `index.html`, `app.js`, `sw.js` |
| Cloud connection (public values) | `config.js` |
| Database tables + security rules | `supabase/migrations/001_init.sql` |
| Call webhook | `supabase/functions/exotel/index.ts` |
| Call rules (tested) | `supabase/functions/_shared/calls.ts`, `calls_test.ts` |
| Notifications | `supabase/functions/_shared/push.ts`, `push-key/index.ts` |
| Deploy | `.github/workflows/backend.yml` |
