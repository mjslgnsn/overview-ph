/* ============================================================
   OVERVIEW PH — DATA SERVICE
   ------------------------------------------------------------
   Reads live story metadata from Firestore (written by Overview
   Studio). This is the replacement for the old hardcoded
   posts-data.js POSTS array.

   NOTE: the article BODY HTML is not stored in Firestore — it
   lives in this same repo at /stories/<slug>.html, one plain
   HTML file per story (see stories/_TEMPLATE.html). Studio only
   holds the metadata: title, image, category, author, dates,
   status, etc. fetchStoryContent() below fetches that file.
   ============================================================ */

import { db } from "./firebase-init.js";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const STORIES = "stories";
const AUTHORS = "authors";

/** Maps the pillar-taxonomy slug (used by nav/pillar pages) onto a Firestore category value. */
const CATEGORY_TO_PILLAR = {
  "Travel": "places",
  "Coffee & Cafés": "coffee-cafes",
  "Culture": "culture",
  "People": "people",
  "Food": "food",
  "Photo Essay": "photo-essays"
};

function formatDateLabel(ts) {
  if (!ts) return "";
  const date = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function toIsoDate(ts) {
  if (!ts) return "";
  const date = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
  return isNaN(date.getTime()) ? "" : date.toISOString();
}

/** Normalizes a raw Firestore story doc into the shape the site's render code expects. */
function mapStory(docSnap) {
  const data = docSnap.data();
  return {
    id: data.slug,
    docId: docSnap.id,
    title: data.title || "Untitled",
    subtitle: data.subtitle || "",
    excerpt: data.excerpt || data.subtitle || "",
    category: data.category || "Travel",
    pillar: CATEGORY_TO_PILLAR[data.category] || "places",
    img: data.heroImage || "assets/img/hero-forest.jpg",
    author: data.author || "Overview PH Editorial",
    read: data.readTime || "5 min read",
    date: toIsoDate(data.publishedAt) || toIsoDate(data.createdAt),
    dateLabel: formatDateLabel(data.publishedAt) || formatDateLabel(data.createdAt),
    featured: !!data.featured,
    spotlight: data.spotlight || "none",
    location: data.location || "",
    place: (data.lat != null && data.lng != null && data.placeName)
      ? { name: data.placeName, lat: data.lat, lng: data.lng }
      : null
  };
}

/** All published stories, newest first. */
export async function fetchPublishedStories() {
  const q = query(
    collection(db, STORIES),
    where("status", "==", "published"),
    orderBy("publishedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(mapStory);
}

/** The single most recently published story — drives "latest release" mechanics. */
export async function fetchLatestStory() {
  const q = query(
    collection(db, STORIES),
    where("status", "==", "published"),
    orderBy("publishedAt", "desc"),
    limit(1)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : mapStory(snap.docs[0]);
}

/** One story by its slug (only if published — drafts 404 on the public site). */
export async function fetchStoryBySlug(slug) {
  const q = query(
    collection(db, STORIES),
    where("slug", "==", slug),
    where("status", "==", "published"),
    limit(1)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : mapStory(snap.docs[0]);
}

/** Up to two stories flagged for the homepage Spotlight section. */
export async function fetchSpotlightStories() {
  const stories = await fetchPublishedStories();
  const business = stories.find((s) => s.spotlight === "business") || null;
  const creator = stories.find((s) => s.spotlight === "creator") || null;
  return { business, creator };
}

/**
 * Fetches the article body HTML for a story from /stories/<slug>.html.
 * Returns a fallback message if the file hasn't been added yet, so a
 * published-in-Studio-but-not-yet-written article never shows a blank page.
 */
export async function fetchStoryContent(slug) {
  try {
    const res = await fetch(`stories/${encodeURIComponent(slug)}.html`, { cache: "no-store" });
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.text();
  } catch (err) {
    return `<p class="story-p reveal">This story was published in Studio, but its article file
      (stories/${slug}.html) hasn't been added to the website yet. Duplicate
      stories/_TEMPLATE.html and fill it in to complete this release.</p>`;
  }
}

/* ============================================================
   AUTHORS
   ------------------------------------------------------------
   Studio maintains a separate "authors" collection (name +
   avatarUrl, uploaded via Cloudinary). Story documents only
   store the author's name as plain text, so avatars are looked
   up by matching that name — case-insensitively — against this
   collection.
   ============================================================ */

/** Every author doc in Studio, as-is ({ name, avatarUrl, ... }). */
export async function fetchAuthors() {
  try {
    const snap = await getDocs(collection(db, AUTHORS));
    return snap.docs.map((d) => ({ docId: d.id, ...d.data() }));
  } catch (err) {
    // Surface this loudly — a silently-swallowed error here (e.g. Firestore
    // security rules not allowing public reads on "authors") is the #1
    // reason avatars would fail to show up anywhere on the site with no
    // visible symptom. Check the browser console for this exact message.
    console.error(
      '[data-service] Could not read the "authors" collection from Firestore. ' +
      'If this says "permission-denied" or "Missing or insufficient permissions", ' +
      'your Firestore security rules likely allow public reads on "stories" but ' +
      'not on "authors" — add a matching read rule for the authors collection. ' +
      'Full error:', err
    );
    return [];
  }
}

/** Map of lowercased author name -> avatarUrl, for quick lookup while rendering story cards. */
export async function fetchAuthorAvatarMap() {
  const authors = await fetchAuthors();
  const map = new Map();
  authors.forEach((a) => {
    if (a.name && a.avatarUrl) map.set(a.name.trim().toLowerCase(), a.avatarUrl);
  });
  return map;
}

/**
 * Renders the small circular avatar used in story-card bylines. Falls
 * back to the original plain color-dot span whenever no matching
 * avatar is on file, so a missing photo never shows a broken image.
 */
export function avatarMarkup(name, avatarMap) {
  const url = avatarMap?.get?.((name || "").trim().toLowerCase());
  if (!url) return `<span class="story-card__avatar" aria-hidden="true"></span>`;
  return `<img class="story-card__avatar story-card__avatar--photo" src="${url}" alt="" loading="lazy" onerror="this.outerHTML='&lt;span class=&quot;story-card__avatar&quot; aria-hidden=&quot;true&quot;&gt;&lt;/span&gt;'">`;
}

/**
 * Every author who has at least one published story, with their
 * story count and the pillars they write for — used to build the
 * Contributors section on contact.html from real publishing history
 * instead of a hand-maintained list.
 */
export async function fetchContributors() {
  const [authors, stories] = await Promise.all([
    fetchAuthors(),
    fetchPublishedStories().catch((err) => {
      console.error('[data-service] Could not read the "stories" collection from Firestore:', err);
      return [];
    })
  ]);

  const avatarByName = new Map();
  authors.forEach((a) => {
    if (a.name) avatarByName.set(a.name.trim().toLowerCase(), a.avatarUrl || "");
  });

  const byName = new Map();
  stories.forEach((s) => {
    const key = (s.author || "").trim();
    if (!key) return;
    const lower = key.toLowerCase();
    if (!byName.has(lower)) {
      byName.set(lower, {
        name: key,
        avatarUrl: avatarByName.get(lower) || "",
        count: 0,
        categories: new Set()
      });
    }
    const entry = byName.get(lower);
    entry.count += 1;
    entry.categories.add(s.category);
  });

  return Array.from(byName.values())
    .map((c) => ({ ...c, categories: Array.from(c.categories) }))
    .sort((a, b) => b.count - a.count);
}

/* ============================================================
   SITE STATS
   ------------------------------------------------------------
   Real numbers for the "50+ Provinces Covered / 100+ Stories
   Published / 30+ Creators Interviewed" stat row on the
   homepage About strip and the Company page — replacing the
   placeholder numbers from the very first mockup, which never
   got wired up to actual data.

   Takes an already-fetched posts array (both index.html and
   contact.html fetch published stories anyway) rather than
   hitting Firestore again.
   ============================================================ */
export function computeSiteStats(posts) {
  const storiesPublished = posts.length;

  // "Province" isn't its own field — Studio only stores a free-text
  // placeName (e.g. "Lipa, Batangas" or just "Bagac"). Best-effort: take
  // whatever's after the last comma as the province, else use the whole
  // name, then de-dupe case-insensitively.
  const provinces = new Set(
    posts
      .filter((p) => p.place && p.place.name)
      .map((p) => {
        const parts = p.place.name.split(',');
        return parts[parts.length - 1].trim().toLowerCase();
      })
  );

  const creators = new Set(
    posts.filter((p) => p.author).map((p) => p.author.trim().toLowerCase())
  );

  return {
    provincesCovered: provinces.size,
    storiesPublished,
    creatorsInterviewed: creators.size
  };
}

/**
 * Writes a computed stats object into the shared stat-row markup
 * (used identically on index.html's About strip and contact.html's
 * About section). Numbers below the "floor" just show the real
 * count — no more hardcoded "50+" placeholders.
 */
export function renderSiteStats(stats) {
  const map = {
    statProvinces: stats.provincesCovered,
    statStories: stats.storiesPublished,
    statCreators: stats.creatorsInterviewed
  };
  Object.entries(map).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
  });
}
