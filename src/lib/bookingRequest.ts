/**
 * Saves a guest's booking request to Firestore `bookingRequests/<code>`, where
 * the Package Generator lists it for managers (firestore.rules checks the
 * shape and keeps them private). Plain REST, like the rest of the site.
 *
 * Nothing is paid here: a manager checks availability (rooms are also sold
 * on Booking.com and by phone) and replies with a package and payment link.
 */
import { currentSite } from '../content/site';

const DB = 'projects/chamtaburu-webapp/databases/(default)/documents';
const API = `https://firestore.googleapis.com/v1/${DB}`;
// The same alphabet as package codes: no 0/O, 1/I/L, so it reads well aloud.
const CODE_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function newCode(): string {
  return Array.from(
    crypto.getRandomValues(new Uint8Array(6)),
    (b) => CODE_CHARS[b % CODE_CHARS.length],
  ).join('');
}

export interface BookingRequest {
  room: string;
  roomName: string;
  ac: boolean;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  name: string;
  /** Digits with country code: "919876543210". */
  phone: string;
  note: string;
  /** The room-only total shown to the guest, 0 when there was none. */
  estimate: number;
  /** Extras asked for (src/content/extras.ts ids). */
  extras: string[];
}

/** Returns the request's code, e.g. "R6X6K2". Throws if it couldn't be saved. */
export async function saveBookingRequest(r: BookingRequest): Promise<string> {
  const fields = {
    p: { stringValue: currentSite.key },
    room: { stringValue: r.room },
    roomName: { stringValue: r.roomName.slice(0, 80) },
    ac: { booleanValue: r.ac },
    ci: { stringValue: r.checkIn },
    co: { stringValue: r.checkOut },
    a: { integerValue: String(r.adults) },
    k: { integerValue: String(r.children) },
    name: { stringValue: r.name.slice(0, 80) },
    phone: { stringValue: r.phone },
    note: { stringValue: r.note.slice(0, 500) },
    est: { integerValue: String(Math.max(0, Math.round(r.estimate))) },
    status: { stringValue: 'new' },
    extras: { arrayValue: { values: r.extras.map((id) => ({ stringValue: id })) } },
  };
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = newCode();
    const res = await fetch(`${API}:commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        writes: [
          {
            update: { name: `${DB}/bookingRequests/${code}`, fields },
            currentDocument: { exists: false },
            updateTransforms: [{ fieldPath: 'created', setToServerValue: 'REQUEST_TIME' }],
          },
        ],
      }),
    });
    if (res.ok) return code;
    // FAILED_PRECONDITION / ALREADY_EXISTS = that code is taken; anything else is a real failure.
    if (res.status !== 400 && res.status !== 409) break;
  }
  throw new Error('booking request not saved');
}
