/* ============================================================
   OVERVIEW PH — SUBSCRIBE.JS
   Two-step "Overview Letter" signup, wired to Firestore +
   EmailJS, used by both the homepage/contact letter panel
   (#letterForm) and the compact footer form (#footerLetterForm)
   on every page.

   STEP 1 — consent gate: "We'll only email you when we publish
            something new. Sound good?" (Agree / No thanks)
   STEP 2 — reveals the existing email field + submit button
   STEP 3 — writes the subscriber to Firestore, sends a branded
            confirmation email via EmailJS, shows a thank-you
   ============================================================ */

import { db } from "./firebase-init.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { emailjsConfig } from "./firebase-config.js";

function isConfigured(cfg) {
  return cfg && Object.values(cfg).every((v) => v && !String(v).startsWith('PASTE_'));
}

async function sendConfirmationEmail(email) {
  if (!isConfigured(emailjsConfig)) {
    console.warn('EmailJS isn\u2019t configured yet (see assets/js/firebase-config.js) — skipping confirmation email.');
    return;
  }
  const mod = await import('https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js');
  const emailjs = mod.default || window.emailjs;
  await emailjs.send(
    emailjsConfig.serviceId,
    emailjsConfig.confirmationTemplateId,
    { to_email: email },
    { publicKey: emailjsConfig.publicKey }
  );
}

async function saveSubscriber(email) {
  await addDoc(collection(db, 'subscribers'), {
    email,
    consent: true,
    subscribedAt: serverTimestamp(),
    source: window.location.pathname
  });
}

function buildGate(variant) {
  const gate = document.createElement('div');
  gate.className = `letter-gate letter-gate--${variant}`;
  gate.innerHTML = `
    <p class="letter-gate__q">We'll only email you when we publish something new — no spam, unsubscribe anytime. Sound good?</p>
    <div class="letter-gate__actions">
      <button type="button" class="btn btn--gold btn--sm" data-gate-agree>I Agree, Notify Me</button>
      <button type="button" class="btn btn--ghost btn--sm" data-gate-decline>No thanks</button>
    </div>
  `;
  return gate;
}

function mountWidget(formId, inputId, noteId, panelSelector, variant) {
  const form = document.getElementById(formId);
  const input = document.getElementById(inputId);
  const note = document.getElementById(noteId);
  if (!form || !input || !note) return;

  const panel = form.closest(panelSelector) || form.parentElement;
  const gate = buildGate(variant);

  // Start gated: hide the real form until the person agrees.
  form.hidden = true;
  panel.insertBefore(gate, form);

  gate.querySelector('[data-gate-decline]').addEventListener('click', () => {
    gate.innerHTML = `<p class="letter-gate__q">No worries — you can subscribe any time.</p>`;
  });

  gate.querySelector('[data-gate-agree]').addEventListener('click', () => {
    gate.remove();
    form.hidden = false;
    input.focus();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = input.value.trim();
    note.classList.remove('is-error', 'is-success');

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      note.textContent = 'Please enter a valid email address.';
      note.classList.add('is-error');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    note.textContent = 'Subscribing…';

    try {
      await saveSubscriber(value);
      try {
        await sendConfirmationEmail(value);
      } catch (mailErr) {
        // Subscription itself succeeded even if the confirmation email failed —
        // don't block the thank-you on a transient EmailJS hiccup.
        console.error('Confirmation email failed to send:', mailErr);
      }
      form.hidden = true;
      note.textContent = `Thank you! You're on the list — we'll email you at ${value} when we publish something new.`;
      note.classList.add('is-success');
      form.reset();
    } catch (err) {
      console.error('Failed to save subscriber:', err);
      note.textContent = 'Something went wrong — please try again in a moment.';
      note.classList.add('is-error');
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  mountWidget('letterForm', 'letterEmail', 'letterNote', '.letter__panel', 'main');
  mountWidget('footerLetterForm', 'footerLetterEmail', 'footerLetterNote', '.footer__col--newsletter', 'footer');
});
