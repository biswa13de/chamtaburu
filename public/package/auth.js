/*
 * Manager sign-in for /package: Firebase phone auth (a code by SMS), or the
 * mobile number and a password. Also the travel partners' email sign-in for
 * /partners (below), so both share one Firebase set-up.
 *
 * Firebase only does passwords for email accounts, so a password manager's
 * account is an address made from their number (emailFor), never emailed and
 * never shown to them. firestore.rules only accepts it if the manager's
 * document names that account's UID, so nobody can sign themselves up as a
 * manager by creating the address first.
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
  getAuth, onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber, signInWithEmailAndPassword, signOut,
  createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, reload,
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

// "+919876543210" → "919876543210@managers.chamtaburu.in".
const DOMAIN = "managers.chamtaburu.in";
export const emailFor = (phone) => phone.replace(/^\+/, "") + "@" + DOMAIN;

// Throws auth/invalid-credential on a wrong number or password.
export async function signInWithPassword(phone, password) {
  await signInWithEmailAndPassword(auth, emailFor(phone), password);
}

// The manager's sign-in number ("+919876543210") for either kind of account.
export function idOf(user) {
  if (user.phoneNumber) return user.phoneNumber;
  const m = (user.email || "").match(/^(91\d{10})@managers\.chamtaburu\.in$/);
  return m ? "+" + m[1] : null;
}

// Sent with each saved quote; firestore.rules checks who it belongs to.
export const token = () => auth.currentUser.getIdToken();

export const logout = () => signOut(auth);

/*
 * Travel partners (public/partners): a real email address and a password,
 * which they create themselves. Their rates only show once the email is
 * verified and an admin has approved them (firestore.rules). Their links come
 * back to /partners.
 */
const back = () => ({ url: location.origin + "/partners" });

export async function signUpPartner(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(cred.user, back());
}
export const signInPartner = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const resendVerification = () => sendEmailVerification(auth.currentUser, back());
export const resetPassword = (email) => sendPasswordResetEmail(auth, email, back());

// After the partner taps the link in their email: the account, and a fresh
// token that says it is verified (firestore.rules reads it from the token).
export async function refreshUser() {
  await reload(auth.currentUser);
  await auth.currentUser.getIdToken(true);
  return auth.currentUser;
}
