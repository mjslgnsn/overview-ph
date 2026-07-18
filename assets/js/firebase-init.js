/* ============================================================
   OVERVIEW PH — FIREBASE INIT
   Initializes the Firebase app + Firestore for the public site,
   using the Firebase JS SDK straight from CDN (no build step).
   Every page that needs live data imports { db } from here.
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
