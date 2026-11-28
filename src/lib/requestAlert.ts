/**
 * Tells the office's alert script about a booking request the moment it's
 * saved, so Telegram and email go out within seconds rather than at the
 * script's next timer run (scripts/request-alerts).
 *
 * Only the request's code is sent. The script reads the request from
 * Firestore itself and alerts only if it's real and not yet alerted, so this
 * link is safe to be public. Fire-and-forget: a beacon still goes if the guest
 * leaves for WhatsApp at once, and if it never arrives, the script's timer
 * alerts a few minutes later.
 */

// The Apps Script web app's link (Deploy → Manage deployments). Empty: the
// timer alone alerts.
const ALERT_URL =
  'https://script.google.com/macros/s/AKfycbwYRit-i692auVjgwHAnBlejh9dJgKGKi3nZokhsyelFQMPnK8EQ0_2r7C4DvAFqSMcBQ/exec';

export function alertNewRequest(code: string): void {
  if (!ALERT_URL || !code || typeof navigator === 'undefined') return;
  // text/plain, so the browser sends it without a CORS preflight.
  const body = JSON.stringify({ code });
  try {
    if (navigator.sendBeacon?.(ALERT_URL, body)) return;
  } catch {
    // fall through to fetch
  }
  fetch(ALERT_URL, { method: 'POST', mode: 'no-cors', keepalive: true, body }).catch(() => {});
}
