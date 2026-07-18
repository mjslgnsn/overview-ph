# Email setup (EmailJS — free, no backend, no domain required)

Two emails go out from this project, both sent client-side via [EmailJS](https://www.emailjs.com):

1. **Confirmation email** — sent the moment someone finishes the two-step subscribe flow on the website (`assets/js/subscribe.js`).
2. **Release notification** — sent to every subscriber when you click **Notify Subscribers** on a published story in Overview Studio (`lib/emailjs.ts`).

## One-time setup

1. **Create a free EmailJS account** at emailjs.com.
2. **Connect a sending address — Email Services → Add New Service.**
   Since you don't have a custom domain yet, choose **Gmail**. This is the best free option: your emails ride on Gmail's own sender reputation instead of a brand-new, unproven domain, which is the single biggest factor in landing in the inbox instead of spam. (You can switch to a custom domain + dedicated service later without changing any site code — just update the Service ID.)
   Note the **Service ID**.
3. **Create the two templates** — Email Templates → Create New Template, one at a time:
   - Paste `emails/confirmation.html` in as the HTML body. Note its **Template ID**.
   - Paste `emails/release-notification.html` in as the HTML body. Note its **Template ID**.
   - In both templates, set the **To email** field to `{{to_email}}`.
   - Set **From Name** to something human, like `Overview PH` — never `no-reply` or `admin`, which spam filters weight negatively.
4. **Get your Public Key** — Account → General.
5. **Fill in the keys** in two places:
   - Website: `assets/js/firebase-config.js` → `emailjsConfig` (confirmation email only).
   - Studio: `.env.local` → `NEXT_PUBLIC_EMAILJS_SERVICE_ID`, `NEXT_PUBLIC_EMAILJS_RELEASE_TEMPLATE_ID`, `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` (release notification email).

## Keeping it out of spam

There's no absolute guarantee — deliverability depends on factors outside this code — but these matter most, roughly in order:

- **Use the Gmail connection above**, not EmailJS's shared default sender. A trusted, established sending address is worth more than any template tweak.
- **Only email people who explicitly opted in.** The two-step consent flow already enforces this — never import or add addresses that didn't subscribe themselves.
- **Keep the unsubscribe link working and visible** (already in both footers). Filters penalize senders whose recipients mark mail as spam instead of unsubscribing — an easy unsubscribe reduces that.
- **Avoid spam-trigger language** in story titles/excerpts if you can help it: ALL CAPS, excessive exclamation points, "free", "click here", "act now".
- **Send consistently, not in bursts.** One email per release is fine; don't batch a month of releases into a single blast.
- **Warm up gradually.** If your subscriber list is small, deliverability is rarely an issue. As it grows past a few hundred, consider moving to a dedicated custom domain with SPF/DKIM/DMARC configured (most transactional email providers — Resend, Postmark, SendGrid — set this up for you when you're ready to upgrade off EmailJS's free tier).

## Limits to know

EmailJS's free tier caps out at **200 emails/month**. `lib/emailjs.ts` sends with a small delay between each subscriber to stay under EmailJS's rate limit, and reports how many sent successfully. If your subscriber list grows past ~150–180, you'll want to upgrade your EmailJS plan or move the release-notification send to a paid provider — the code is small and isolated in `lib/emailjs.ts` specifically so that's a contained change later.

Service ID: service_f58x9yh
Template ID (Confirmation) : template_xgeyzpl
Template ID (New Blog Release) : template_m7deskl

Public Key: n0We5tqnhhkutGqG-

private key: sUp4DnwXaMc4Oo5t09zSP
