import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

let _auth = null;

// Only real Gmail addresses are accepted. Rejects mani@gml.cm, typos, other domains.
const GMAIL_RE = /^[^\s@]+@gmail\.com$/i;
function requireGmail(email) {
  if (!GMAIL_RE.test(email)) {
    const err = new Error("Only @gmail.com email addresses are allowed.");
    err.code = "auth/gmail-only";
    throw err;
  }
}

export function initAuth(app) {
  if (!app) return null;
  try {
    _auth = getAuth(app);
    return _auth;
  } catch (e) {
    console.error("Auth init failed:", e);
    return null;
  }
}

export function watchAuth(cb) {
  if (!_auth) { cb(null); return () => {}; }
  return onAuthStateChanged(_auth, cb);
}

export async function emailLogin(email, password) {
  if (!_auth) throw new Error("Firebase not configured — fill config.js");
  requireGmail(email);
  const { user } = await signInWithEmailAndPassword(_auth, email, password);
  return user;
}

export async function emailSignup(email, password) {
  if (!_auth) throw new Error("Firebase not configured — fill config.js");
  requireGmail(email);
  const { user } = await createUserWithEmailAndPassword(_auth, email, password);
  return user;
}

export async function googleLogin() {
  if (!_auth) throw new Error("Firebase not configured — fill config.js");
  const { user } = await signInWithPopup(_auth, new GoogleAuthProvider());
  return user;
}

export async function signOutUser() {
  if (_auth) await signOut(_auth);
  localStorage.removeItem("vulnera_guest");
}
