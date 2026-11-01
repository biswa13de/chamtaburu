/*
 * Manager sign-in for /package: Firebase phone auth (a code by SMS).
 *
 * generator.js loads this with import() so a blocked or offline CDN shows an
 * error instead of a dead page. Firebase keeps the manager signed in on that
 * phone until they tap Sign out, so the SMS is only needed once per device.
 *
 * Who counts as a manager is the `managers` collection in Firestore (see
 * loadManager in package-core.js), checked before any SMS is sent and again by
 * firestore.rules when a quote is saved.
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber, signOut,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// From the Firebase console: Project settings → General → Your apps → Web app.
// Not a secret — it only names the project.
const app = initializeApp({
  apiKey: "AIzaSyArlDtTs21ffCWNvZT7-47gCV-7y-IzwBs",
  authDomain: "chamtaburu-webapp.firebaseapp.com",
  projectId: "chamtaburu-webapp",
});
const auth = getAuth(app);
auth.languageCode = "en";

// Firebase requires a reCAPTCHA before it sends an SMS. The invisible one only
// shows a challenge when Google is unsure. A fresh one per attempt, removed once
// signed in so its badge doesn't sit over the generator.
let verifier = null;
let box = null;
let pending = null;

function dropVerifier() {
  if (verifier) verifier.clear();
  if (box) box.remove();
  verifier = box = null;
}

export function onUser(cb) {
  onAuthStateChanged(auth, cb);
}

// `phone` in E.164, e.g. "+919876543210".
export async function sendCode(phone) {
  dropVerifier();
  box = document.createElement("div");
  document.body.append(box);
  verifier = new RecaptchaVerifier(auth, box, { size: "invisible" });
  try {
    pending = await signInWithPhoneNumber(auth, phone, verifier);
  } catch (e) {
    dropVerifier();
    throw e;
  }
}

// Throws on a wrong or expired code. On success onUser's callback fires.
export async function confirmCode(code) {
  if (!pending) throw Object.assign(new Error("no code request"), { code: "auth/invalid-verification-id" });
  await pending.confirm(code);
  pending = null;
  dropVerifier();
}

// Sent with each saved quote; firestore.rules checks the phone number in it.
export const token = () => auth.currentUser.getIdToken();

export const phone = () => auth.currentUser.phoneNumber;

export const logout = () => signOut(auth);
