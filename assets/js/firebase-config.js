/* ============================================================
   OVERVIEW PH — FIREBASE CONFIG
   ------------------------------------------------------------
   Fill these in with the EXACT SAME values you already used in
   Overview Studio's .env.local (Firebase Console → Project
   settings → General → Your apps → SDK setup and configuration).
   They're safe to expose in client-side code — that's how every
   Firebase web app config works; access is controlled instead by
   firestore.rules, not by hiding these values.
   ============================================================ */

export const firebaseConfig = {
  apiKey: "AIzaSyAY3PX0XWl6N_WrcH9osN2YPByBj-VzyAo",
  authDomain: "overview-ph.firebaseapp.com",
  projectId: "overview-ph",
  messagingSenderId: "911931088334",
  appId: "1:911931088334:web:18b058c3c0633ad6fbdf9f"
};

/* ============================================================
   EMAILJS CONFIG
   ------------------------------------------------------------
   Same values as the Studio's .env.local EmailJS keys.
   See Overview PH/emails/README.md for full setup steps.
   ============================================================ */
export const emailjsConfig = {
  serviceId: "service_f58x9yh",
  confirmationTemplateId: "template_xgeyzpl",
  publicKey: "n0We5tqnhhkutGqG-"
};
