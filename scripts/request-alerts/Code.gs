/**
 * Chamtaburu website request alerts: a Google Apps Script (script.google.com),
 * not part of the website build. Setup steps are in README.md next to this file.
 *
 * Every few minutes it reads the new booking requests the website saved to
 * Firestore `bookingRequests` (from /book and the Contact page's enquiry form),
 * emails each one to the office, posts it to a Telegram group when one is set
 * up, and adds it as a row to a Google Sheet.
 *
 * It runs as the Google account that owns the Firebase project and reads with
 * that account's own access, so the website needs no email service, nothing
 * here is public, and nobody can use it to send email. Gmail allows it about
 * 100 recipients a day on a free account (1,500 on Google Workspace): each
 * address in ALERT_TO counts, so 2 addresses is about 50 requests a day.
 *
 * Read-only on Firestore: the last request it handled is kept in this script's
 * properties, not written back to the database.
 */

const PROJECT_ID = 'chamtaburu-webapp';
// Who gets the alerts. Several: 'info@chamtaburu.in, someone@gmail.com'.
const ALERT_TO = 'info@chamtaburu.in';
const EVERY_MINUTES = 5; // 1, 5, 10, 15 or 30
const SHEET_NAME = 'Chamtaburu website requests';

const SITES = {
  village: { name: 'Chamtaburu Eco Village', domain: 'chamtaburu.in' },
  resort: { name: 'Chamtaburu Eco Resort', domain: 'resort.chamtaburu.in' },
};
// src/content/extras.ts
const EXTRAS = {
  'pickup-purulia': 'Pickup from Purulia',
  'pickup-barabhum': 'Pickup from Barabhum',
  'drop-purulia': 'Drop to Purulia',
  'drop-barabhum': 'Drop to Barabhum',
  day1: 'Purulia local sightseeing',
  day2: 'Ajodhya Hill tour',
  day3: 'Baranti tour',
  meals: 'All meals included',
  bonfire: 'Bonfire',
  decor: 'Room decoration',
};
const HEADERS = ['Received', 'Code', 'Property', 'From', 'Name', 'Phone', 'Rooms', 'Check-in', 'Check-out', 'Nights', 'Adults', 'Children', 'Extras', 'Price shown', 'Note'];

const DB = `projects/${PROJECT_ID}/databases/(default)/documents`;
const LAST_KEY = 'lastCreated';
const SHEET_KEY = 'sheetId';
// Telegram, optional. Kept in Project Settings → Script properties, never in
// this file: the bot token is a password. TELEGRAM_CHAT_ID is filled in by
// findTelegramGroup.
const TG_TOKEN_KEY = 'TELEGRAM_BOT_TOKEN';
const TG_CHAT_KEY = 'TELEGRAM_CHAT_ID';

/**
 * Run once from the editor (choose "setup", then Run). Checks it can read the
 * requests, creates the Sheet, and starts the timer. Requests sent before this
 * are not emailed. Safe to run again: it keeps its place and the Sheet.
 */
function setup() {
  const props = PropertiesService.getScriptProperties();
  fetchSince(new Date().toISOString(), 1); // fails here if this account can't read Firestore
  if (!props.getProperty(LAST_KEY)) props.setProperty(LAST_KEY, new Date().toISOString());
  const sheet = getSheet();
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'checkNewRequests')
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('checkNewRequests').timeBased().everyMinutes(EVERY_MINUTES).create();
  Logger.log(`Ready. New requests are emailed to ${ALERT_TO} within ${EVERY_MINUTES} minutes and listed in ${sheet.getParent().getUrl()}`);
}

/** Run from the editor to see what an alert looks like. */
function sendTestEmail() {
  const now = new Date().toISOString();
  const r = {
    code: 'TEST42', p: 'village', src: '', name: 'Test Guest', phone: '919876543210',
    items: [{ name: 'AC Cottage', q: 2, ac: true }], ci: '2026-12-24', co: '2026-12-26',
    a: 4, k: 1, extras: ['pickup-purulia', 'bonfire'], est: 22000, note: 'This is a test alert.', created: now,
  };
  MailApp.sendEmail({ to: ALERT_TO, subject: '[Test] ' + subject(r), body: body(r), name: 'Chamtaburu website' });
  Logger.log('Test email sent to ' + ALERT_TO);
}

/**
 * Run by the timer: emails, posts to Telegram and lists every request since
 * the last one handled. Past Gmail's daily limit, Telegram alone carries on;
 * with no Telegram either, the rest wait for tomorrow.
 */
function checkNewRequests() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return; // the previous run is still going
  try {
    const props = PropertiesService.getScriptProperties();
    const last = props.getProperty(LAST_KEY);
    if (!last) throw new Error('Run setup first.');
    const sheet = getSheet();
    const tg = telegramReady();
    for (const r of fetchSince(last, 50)) {
      const canEmail = MailApp.getRemainingDailyQuota() >= ALERT_TO.split(',').length;
      if (!canEmail && !tg) {
        Logger.log('Gmail daily limit reached; the rest are sent tomorrow.');
        return;
      }
      if (canEmail) MailApp.sendEmail({ to: ALERT_TO, subject: subject(r), body: body(r), name: 'Chamtaburu website' });
      else Logger.log(`Gmail daily limit reached: ${r.code} went to Telegram only.`);
      if (tg) telegram(telegramText(r));
      sheet.appendRow(row(r));
      props.setProperty(LAST_KEY, r.created);
    }
  } finally {
    lock.releaseLock();
  }
}

/* ---------- Telegram ---------- */

/**
 * Run after adding the bot to your Telegram group (README.md). Finds the
 * group from the bot's recent messages and saves it, then posts a test.
 */
function findTelegramGroup() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty(TG_TOKEN_KEY)) throw new Error(`Add the bot token as the script property ${TG_TOKEN_KEY} first.`);
  const updates = telegramApi('getUpdates', {}).result || [];
  const groups = {};
  updates.forEach((u) => {
    const m = u.message || u.my_chat_member || u.channel_post || {};
    if (m.chat && m.chat.type !== 'private') groups[m.chat.id] = m.chat.title;
  });
  const ids = Object.keys(groups);
  if (!ids.length) {
    throw new Error('No group found. Add the bot to the group (or remove and add it again), send a message in the group, then run this again within a day.');
  }
  if (ids.length > 1) {
    throw new Error('The bot is in more than one group: ' + ids.map((id) => `${groups[id]} (${id})`).join(', ')
      + `. Put the right ID in the script property ${TG_CHAT_KEY}, then run sendTestTelegram.`);
  }
  props.setProperty(TG_CHAT_KEY, ids[0]);
  Logger.log(`Saved the group "${groups[ids[0]]}". Sending a test…`);
  sendTestTelegram();
}

/** Run from the editor to see what a Telegram alert looks like. */
function sendTestTelegram() {
  if (!telegramReady()) throw new Error('Telegram is not set up yet: see README.md.');
  const r = {
    code: 'TEST42', p: 'village', src: '', name: 'Test Guest', phone: '919876543210',
    items: [{ name: 'AC Cottage', q: 2, ac: true }], ci: '2026-12-24', co: '2026-12-26',
    a: 4, k: 1, extras: ['pickup-purulia', 'bonfire'], est: 22000, note: 'This is a test alert.', created: new Date().toISOString(),
  };
  if (!telegram('[Test] ' + telegramText(r))) throw new Error("Couldn't post to the group: see the log above.");
  Logger.log('Test posted to the Telegram group.');
}

function telegramReady() {
  const props = PropertiesService.getScriptProperties();
  return !!(props.getProperty(TG_TOKEN_KEY) && props.getProperty(TG_CHAT_KEY));
}

// Posts to the group. A failure is logged, not thrown, so one Telegram
// problem never stops the emails or sends them twice.
function telegram(text) {
  const props = PropertiesService.getScriptProperties();
  const send = () => telegramApi('sendMessage', {
    chat_id: props.getProperty(TG_CHAT_KEY), text, link_preview_options: { is_disabled: true },
  });
  let res = send();
  // A group that became a supergroup gets a new ID: switch to it and retry.
  const moved = res.parameters && res.parameters.migrate_to_chat_id;
  if (!res.ok && moved) {
    props.setProperty(TG_CHAT_KEY, String(moved));
    res = send();
  }
  if (!res.ok) console.error(`Telegram: ${res.error_code} ${res.description}`);
  return !!res.ok;
}

function telegramApi(method, payload) {
  const token = PropertiesService.getScriptProperties().getProperty(TG_TOKEN_KEY);
  const res = UrlFetchApp.fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true,
  });
  try {
    return JSON.parse(res.getContentText());
  } catch (e) {
    return { ok: false, error_code: res.getResponseCode(), description: res.getContentText().slice(0, 200) };
  }
}

function telegramText(r) {
  return [
    `🛎 ${kind(r)} ${r.code} · ${site(r).name}`,
    `${r.name} · ${phone(r.phone)}`,
    rooms(r),
    `${day(r.ci)} → ${day(r.co)} · ${plural(nights(r), 'night')}`,
    guests(r),
    r.extras.length ? `Also: ${extras(r)}` : null,
    r.est ? `Price shown: ${inr(r.est)}` : null,
    r.note ? `Note: ${r.note}` : null,
    '',
    `WhatsApp: https://wa.me/${r.phone}`,
    `Generator: https://${site(r).domain}/package`,
  ].filter((line) => line !== null).join('\n');
}

// Requests created after `since` (an RFC 3339 time), oldest first.
function fetchSince(since, limit) {
  const res = UrlFetchApp.fetch(`https://firestore.googleapis.com/v1/${DB}:runQuery`, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
      // Bill the read to the Firebase project, where Firestore is switched on,
      // not to this script's own hidden Cloud project.
      'x-goog-user-project': PROJECT_ID,
    },
    muteHttpExceptions: true,
    payload: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'bookingRequests' }],
        where: { fieldFilter: { field: { fieldPath: 'created' }, op: 'GREATER_THAN', value: { timestampValue: since } } },
        orderBy: [{ field: { fieldPath: 'created' }, direction: 'ASCENDING' }],
        limit,
      },
    }),
  });
  if (res.getResponseCode() !== 200) {
    throw new Error(`Couldn't read the requests (${res.getResponseCode()}). Is this the Google account that owns the Firebase project ${PROJECT_ID}? ${res.getContentText().slice(0, 300)}`);
  }
  return JSON.parse(res.getContentText()).filter((x) => x.document).map((x) => parse(x.document));
}

function parse(d) {
  const f = d.fields || {};
  const s = (m, k) => (m[k] && m[k].stringValue) || '';
  const n = (m, k) => Number((m[k] && m[k].integerValue) || 0);
  const b = (m, k) => !!(m[k] && m[k].booleanValue);
  const list = (k) => (f[k] && f[k].arrayValue && f[k].arrayValue.values) || [];
  const items = list('items').map((v) => {
    const m = (v.mapValue && v.mapValue.fields) || {};
    return { name: s(m, 'name'), q: n(m, 'q') || 1, ac: b(m, 'ac') };
  });
  return {
    code: d.name.split('/').pop(), p: s(f, 'p'), src: s(f, 'src'),
    name: s(f, 'name'), phone: s(f, 'phone'),
    items: items.length ? items : [{ name: s(f, 'roomName'), q: 1, ac: b(f, 'ac') }],
    ci: s(f, 'ci'), co: s(f, 'co'), a: n(f, 'a'), k: n(f, 'k'),
    extras: list('extras').map((v) => v.stringValue), est: n(f, 'est'), note: s(f, 'note'),
    created: f.created.timestampValue,
  };
}

const site = (r) => SITES[r.p] || { name: r.p, domain: 'chamtaburu.in' };
const kind = (r) => (r.src === 'contact' ? 'Enquiry' : 'Booking request');
const from = (r) => (r.src === 'contact' ? 'Contact page' : 'Book page');
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const nights = (r) => Math.round((Date.parse(r.co) - Date.parse(r.ci)) / 86400000);
const day = (iso) => Utilities.formatDate(new Date(iso + 'T00:00:00Z'), 'UTC', 'EEE d MMM yyyy');
const when = (ts) => Utilities.formatDate(new Date(ts), 'Asia/Kolkata', 'd MMM yyyy, h:mm a');
const phone = (p) => (p.length === 12 ? `+${p.slice(0, 2)} ${p.slice(2, 7)} ${p.slice(7)}` : p);
const rooms = (r) => r.items.map((it) => (it.q > 1 ? it.q + ' × ' : '') + it.name + (it.ac ? ' (AC)' : '')).join(', ');
const guests = (r) => plural(r.a, 'adult') + (r.k ? ', ' + (r.k === 1 ? '1 child' : r.k + ' children') : '');
const extras = (r) => r.extras.map((id) => EXTRAS[id] || id).join(', ');
const inr = (n) => '₹' + n.toLocaleString('en-IN');

function subject(r) {
  return `${kind(r)} ${r.code} · ${r.name} · ${day(r.ci)} · ${site(r).name}`;
}

function body(r) {
  return [
    `New ${kind(r).toLowerCase()} from the ${from(r)} of ${site(r).domain}`,
    '',
    `Name: ${r.name}`,
    `Phone: ${phone(r.phone)}`,
    `WhatsApp: https://wa.me/${r.phone}`,
    '',
    `Rooms: ${rooms(r)}`,
    `Dates: ${day(r.ci)} → ${day(r.co)} · ${plural(nights(r), 'night')}`,
    `Guests: ${guests(r)}`,
    r.extras.length ? `Also asked for: ${extras(r)}` : null,
    r.est ? `Price shown: ${inr(r.est)}` : null,
    r.note ? `Note: ${r.note}` : null,
    '',
    `Code: ${r.code} · received ${when(r.created)}`,
    '',
    `Make the package in the Package Generator (it's under Booking requests): https://${site(r).domain}/package`,
  ].filter((line) => line !== null).join('\n');
}

function row(r) {
  return [when(r.created), r.code, site(r).name, from(r), r.name, phone(r.phone), rooms(r), r.ci, r.co, nights(r), r.a, r.k, extras(r), r.est || '', r.note];
}

function getSheet() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty(SHEET_KEY);
  if (id) return SpreadsheetApp.openById(id).getSheets()[0];
  const book = SpreadsheetApp.create(SHEET_NAME);
  const sheet = book.getSheets()[0];
  sheet.appendRow(HEADERS);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  props.setProperty(SHEET_KEY, book.getId());
  return sheet;
}
