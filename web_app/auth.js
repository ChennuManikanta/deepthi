import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendEmailVerification,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

let _auth = null;

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
  const { user } = await signInWithEmailAndPassword(_auth, email, password);
  // Block sign-in until the address is proven real via the verification link.
  if (!user.emailVerified) {
    await sendEmailVerification(user);
    await signOut(_auth);
    const err = new Error("Email not verified — we've re-sent the link. Check your inbox.");
    err.code = "auth/email-not-verified";
    throw err;
  }
  return user;
}

export async function emailSignup(email, password) {
  if (!_auth) throw new Error("Firebase not configured — fill config.js");
  const { user } = await createUserWithEmailAndPassword(_auth, email, password);
  // A typo'd/fake address never receives this link, so it can never sign in.
  await sendEmailVerification(user);
  await signOut(_auth); // don't let unverified accounts straight into the app
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
