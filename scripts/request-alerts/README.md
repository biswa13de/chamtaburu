# Request alerts (Google Apps Script)

Emails the office about each new booking request and enquiry from the website,
and keeps a Google Sheet of them. It replaces Formspree, whose free plan
stopped at 50 a month.

How it works: the website's `/book` page and Contact page enquiry form save
every request to Firestore `bookingRequests` (`src/lib/bookingRequest.ts`). The
Package Generator lists them under **Booking requests**. Every 5 minutes this
script, running in the Firebase project owner's Google account, reads any new
ones, emails each to `info@chamtaburu.in` and adds it to the Sheet.

- **Cost:** ₹0. Gmail lets a script email about 100 recipients a day from a
  free account (1,500 on Google Workspace). Each address counts: with 2
  addresses that's about 50 requests a day. If it hits the limit, the rest go
  out the next day.
- **Safe:** nothing is public. The website never calls the script, so nobody
  can use it to send email. It only reads Firestore.
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
