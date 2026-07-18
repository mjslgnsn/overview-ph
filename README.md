# Overview PH — See Beyond the Surface

**Live site:** [overviewph.netlify.app](https://overviewph.netlify.app)

Overview PH is a modern Filipino editorial magazine documenting the
Philippines worth looking at twice — the places, cafés, traditions,
people, and communities that don't always make the postcard. Six
pillars, one publication: **Places, Coffee & Cafés, Culture, People,
Food,** and **Photo Essays.**

This repo is the public-facing website — a fast, static site with no
build step, backed by live data from [Overview Studio](#), our
internal CMS.

## Stack

- **Frontend:** plain HTML/CSS/JS (ES modules), no framework, no bundler
- **Data:** [Firebase Firestore](https://firebase.google.com/docs/firestore) — story metadata is written by Overview Studio and read live by this site
- **Media:** [Cloudinary](https://cloudinary.com) — hero and in-article images are uploaded via Studio; this site just displays the resulting URLs
- **Email:** [EmailJS](https://www.emailjs.com) — sends the newsletter's confirmation and new-release emails, no server required
- **Hosting:** [Netlify](https://netlify.com)
- **Maps:** [Leaflet](https://leafletjs.com) + CartoDB tiles

## Project structure

```
Overview PH/
├── index.html            Homepage — pillars, latest stories, map, spotlight
├── pillar.html            One content pillar's story archive (?pillar=places)
├── search.html            Search results / browse-all
├── story.html              Single article (?slug=your-story-slug)
├── contact.html           Contact + newsletter
├── stories/                 ← one HTML file per published article's body
│   └── _TEMPLATE.html        Copy this to start a new story
├── emails/                    EmailJS template source + setup guide
├── assets/
│   ├── css/style.css
│   ├── js/
│   │   ├── firebase-config.js    ← your Firebase/EmailJS keys go here
│   │   ├── firebase-init.js
│   │   ├── data-service.js       Firestore reads (stories, spotlight, latest)
│   │   ├── pillars-data.js       Static pillar taxonomy
│   │   ├── subscribe.js          Two-step newsletter opt-in
│   │   ├── main.js / pillar.js / search.js / story.js / site.js / map.js
│   └── vendor/leaflet/
└── README.md
```

## How publishing works

1. A story is written and published in **Overview Studio** (title,
   category, hero image, author, etc.) — this writes a document to
   Firestore.
2. The article body itself lives in this repo, one plain HTML file per
   story at `stories/<slug>.html` (see `stories/_TEMPLATE.html` for the
   format and available classes: drop-cap paragraphs, pull-quotes,
   photos, animated stats).
3. This site fetches both — metadata from Firestore, body from the
   matching file — and renders the page. No demo or placeholder
   content ships in this repo; an empty Firestore collection means an
   empty (but fully working) site.

## Local development

No build step — just don't open `index.html` directly via `file://`
(the browser blocks ES modules from loading that way). Serve it
locally instead:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Setup

1. Copy your Firebase web config and EmailJS keys into
   `assets/js/firebase-config.js` (values come from the same Firebase
   project used by Overview Studio).
2. Deploy `firestore.rules` from the Studio project so this site can
   read published stories and accept newsletter sign-ups.
3. Follow `emails/README.md` to connect EmailJS.

See `README.md` inside the `Overview PH` folder for the full
story-publishing walkthrough.

---

© Overview PH. See beyond the surface.
