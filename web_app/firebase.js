// Firebase Web SDK — saves wound analyses to the Realtime Database, per user.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getDatabase, ref, push, get, query, orderByChild, limitToLast,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

import { FIREBASE_CONFIG } from "./config.js";

let db = null;
let ready = false;
export let firebaseApp = null;

export function initFirebase() {
  try {
    if (!FIREBASE_CONFIG.apiKey || FIREBASE_CONFIG.apiKey.includes("YOUR_")) {
      console.warn("Firebase config not filled in — cloud sync disabled.");
      return false;
    }
    firebaseApp = initializeApp(FIREBASE_CONFIG);
    db = getDatabase(firebaseApp);
    ready = true;
    return true;
  } catch (e) {
    console.error("Firebase init failed:", e);
    return false;
  }
}

// Save under users/<uid>/analyses so each account only has its own data.
// Throws on failure so the caller can show the user what went wrong.
export async function saveAnalysis(plan, meta) {
  if (!ready || !db) throw new Error("Firebase not configured");
  if (!meta.uid) throw new Error("Not signed in");
  await push(ref(db, `users/${meta.uid}/analyses`), {
    woundDay: meta.woundDay ?? null,
    userNotes: meta.userNotes ?? null,
    email: meta.email ?? null,
    assessment: plan.assessment || "",
    woundType: plan.wound_type || "",
    severity: plan.severity || "",
    healingStage: plan.healing_stage || "",
    precautions: plan.precautions || [],
    otcProducts: plan.otc_products || [],
    redFlags: plan.red_flags || [],
    timeline14d: plan.timeline_14d || [],
    healingCurve: plan.healing_curve || [],
    ts: Date.now(),
  });
}

// RTDB drops empty arrays (→ null) and may return arrays as objects; normalise.
const toArr = (v) =>
  Array.isArray(v) ? v : (v && typeof v === "object" ? Object.values(v) : []);

// Returns the signed-in user's most recent saved analysis (shaped like a fresh
// `plan`), or null. Path is scoped by uid so users only see their own data.
export async function loadLatestAnalysis(uid) {
  if (!ready || !db || !uid) return null;
  try {
    const snap = await get(
      query(ref(db, `users/${uid}/analyses`), orderByChild("ts"), limitToLast(1))
    );
    if (!snap.exists()) return null;
    let d = null;
    snap.forEach(child => { d = child.val(); }); // one item due to limitToLast(1)
    if (!d) return null;
    return {
      assessment:    d.assessment,
      wound_type:    d.woundType,
      severity:      d.severity,
      healing_stage: d.healingStage,
      precautions:   toArr(d.precautions),
      otc_products:  toArr(d.otcProducts),
      red_flags:     toArr(d.redFlags),
      timeline_14d:  toArr(d.timeline14d),
      healing_curve: toArr(d.healingCurve),
    };
  } catch (e) {
    console.error("Load failed:", e);
    return null;
  }
}
