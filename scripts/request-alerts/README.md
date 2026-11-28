# Request alerts (Google Apps Script)

Emails the office about each new booking request and enquiry from the website,
and keeps a Google Sheet of them. It replaces Formspree, whose free plan
stopped at 50 a month.

How it works: the website's `/book` page and Contact page enquiry form save
every request to Firestore `bookingRequests` (`src/lib/bookingRequest.ts`). The
Package Generator lists them under **Booking requests**. This script, running
in the Firebase project owner's Google account, posts each new one to a
Telegram group (if set up), emails it to `info@chamtaburu.in` and adds it to
the Sheet:

- **Instantly:** once a request is saved, the website sends its code to this
  script's web app (`src/lib/requestAlert.ts`). Alerts arrive within seconds.
- **Every 5 minutes, as a backup:** a timer catches any the website couldn't
  report. Google runs timers loosely, so these can take 5–10 minutes.

Each request is alerted once, whichever way gets there first.

- **Cost:** ₹0. Gmail lets a script email about 100 recipients a day from a
  free account (1,500 on Google Workspace). Each address counts: with 2
  addresses that's about 50 requests a day. If it hits the limit, the rest go
  out the next day.
- **Safe:** the website only sends the web app a request's code. The script
  reads that request from Firestore itself and alerts only if it's real and
  not yet alerted, so nobody can use the link to send made-up alerts. It only
  reads Firestore, and answers at most 30 calls in 10 minutes.
- **If it stops:** requests are still saved and listed in the Package
  Generator, and the guest's WhatsApp message still arrives. Google emails the
  script's owner when a run fails.

## Setup (once, about 10 minutes)

Use the Google account that owns the Firebase project `chamtaburu-webapp`,
the one you sign in to console.firebase.google.com with.

1. Go to <https://script.google.com>, click **New project**, and name it
   *Chamtaburu request alerts*.
2. Delete what's in `Code.gs` and paste in all of [`Code.gs`](Code.gs).
3. Open **Project Settings** (the gear icon) and tick **Show
   "appsscript.json" manifest file in editor**. Back in the **Editor**, open
   `appsscript.json` and replace it with [`appsscript.json`](appsscript.json).
4. Click **Save**. In the function menu at the top, choose **setup**, then
   click **Run**. Google asks you to allow access. Choose your account, then
   **Advanced → Go to Chamtaburu request alerts (unsafe)** (it's your own
   script), then **Allow**.
5. The log should say *Ready*, with a link to the new Sheet *Chamtaburu
   website requests* in your Drive.
6. Optional: choose **sendTestEmail** and click **Run** to see what an alert
   looks like.

The only requests it emails are those sent after `setup` ran. To check more
often, change `EVERY_MINUTES` at the top of `Code.gs`, then run **setup** again.

## Instant alerts (web app, once)

1. In Apps Script, click **Deploy → New deployment**. Click the gear next to
   *Select type* and choose **Web app**.
2. Set **Execute as** to **Me** and **Who has access** to **Anyone**. (Anyone
   can call it, but it only alerts for real new requests: see *Safe* above.)
3. Click **Deploy**, allow access if asked, and copy the **Web app URL**
   (`https://script.google.com/macros/s/…/exec`). Opening it in a browser
   should show *Chamtaburu request alerts: running.*
4. That link goes in `ALERT_URL` in `src/lib/requestAlert.ts` on the website.

**After pasting in a new `Code.gs`,** the web app keeps running the old code
until you update it: **Deploy → Manage deployments**, click the pencil, set
**Version** to **New version**, then **Deploy**. The link stays the same. The
timer always runs the latest code.

## More than one person getting the alerts

Either way is free:

- **List them in the script:** change `ALERT_TO` at the top of `Code.gs` to
  the addresses separated by commas, e.g. `'info@chamtaburu.in, someone@gmail.com'`,
  and click **Save** (no need to run setup again). Each address uses up the
  daily limit, so 2 addresses is about 50 requests a day.
- **Forward from info@chamtaburu.in:** keep one address in the script and have
  that inbox forward the alerts (a Gmail filter on the sender *Chamtaburu
  website*, or a Google Group). Forwarding doesn't use the script's limit, so
  everyone gets them and it stays at about 100 requests a day.

## Telegram group alerts (optional, free)

Each new request is also posted to a Telegram group, so everyone in it gets an
instant phone notification. There's no daily limit, and if Gmail's limit is
reached, Telegram carries on by itself.

1. **Make a bot.** In Telegram, open **@BotFather** (the one with the blue
   tick), send `/newbot`, give it a name (e.g. *Chamtaburu Bookings*) and a
   username ending in `bot`. BotFather replies with a **token** like
   `123456789:AA…`. Treat it as a password: never put it in `Code.gs` or on
   GitHub.
2. **Make the group.** Create a group (e.g. *Chamtaburu Bookings*), add the
   staff who should get alerts, then add the bot by its username. Send any
   message in the group, such as `hello`.
3. **Give the script the token.** In Apps Script, paste in the latest
   [`Code.gs`](Code.gs) (keep your own `ALERT_TO` line) and click **Save**.
   Open **Project Settings** (the gear icon), and under **Script properties**
   click **Add script property**. Enter `TELEGRAM_BOT_TOKEN` as the property
   and the token as the value, then click **Save script properties**.
4. **Connect the group.** Back in the **Editor**, choose
   **findTelegramGroup** and click **Run**. It finds the group, saves it as
   `TELEGRAM_CHAT_ID`, and posts a test message there.

You don't need to run setup again. To test later, run **sendTestTelegram**.
Each alert includes the guest's name and number, so only add staff to the
group. To stop the Telegram alerts, delete the two script properties.

## Website side

The Contact page's requests need the updated Firestore rules (they're marked
`src: "contact"`): `firebase deploy --only firestore:rules`. Until then, its
enquiries only reach you on WhatsApp. `/book` is unaffected.

## If the log shows an error

- **403 / PERMISSION_DENIED:** the script is in a Google account that isn't an
  owner or editor of the Firebase project. Use that account, or add this
  account under Firebase console → Project settings → Users and permissions.
- **SERVICE_DISABLED / USER_PROJECT_DENIED:** the account needs the *Service
  Usage Consumer* role (owners and editors already have it) on the project.
