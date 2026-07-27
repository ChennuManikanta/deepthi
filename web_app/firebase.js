// Firebase Web SDK — saves wound analysis results to Firestore.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, serverTimestamp,
  query, where, getDocs,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

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
    db = getFirestore(firebaseApp);
    ready = true;
    return true;
  } catch (e) {
    console.error("Firebase init failed:", e);
    return false;
  }
}

export async function saveAnalysis(plan, meta) {
  if (!ready || !db) return;
  try {
    await addDoc(collection(db, "wound_analyses"), {
      ...meta,
      assessment: plan.assessment || "",
      woundType: plan.wound_type || "",
      severity: plan.severity || "",
      healingStage: plan.healing_stage || "",
      precautions: plan.precautions || [],
      otcProducts: plan.otc_products || [],
      redFlags: plan.red_flags || [],
      timeline14d: plan.timeline_14d || [],
      healingCurve: plan.healing_curve || [],
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.error("Firestore save failed:", e);
  }
}

// Returns the signed-in user's most recent saved analysis (shaped like a fresh
// `plan`), or null. Scoped by uid so users only ever see their own data.
export async function loadLatestAnalysis(uid) {
  if (!ready || !db || !uid) return null;
  try {
    const snap = await getDocs(
      query(collection(db, "wound_analyses"), where("uid", "==", uid))
    );
    if (snap.empty) return null;
    // ponytail: client-side sort avoids a composite Firestore index; fine at personal scale.
    const docs = snap.docs.map(d => d.data());
    docs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
    const d = docs[0];
    return {
      assessment:    d.assessment,
      wound_type:    d.woundType,
      severity:      d.severity,
      healing_stage: d.healingStage,
      precautions:   d.precautions,
      otc_products:  d.otcProducts,
      red_flags:     d.redFlags,
      timeline_14d:  d.timeline14d,
      healing_curve: d.healingCurve,
    };
  } catch (e) {
    console.error("Firestore load failed:", e);
    return null;
  }
}
