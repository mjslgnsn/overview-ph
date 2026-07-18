/* ============================================================
   OVERVIEW PH — PILLAR.JS
   Reads ?pillar=<slug> and renders the matching pillar header
   + story grid, sourced live from Firestore.
   ============================================================ */

import { PILLARS } from "./pillars-data.js";
import { fetchPublishedStories, fetchAuthorAvatarMap, avatarMarkup } from "./data-service.js";

document.addEventListener('DOMContentLoaded', async () => {

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('pillar') || '';
  const pillar = PILLARS.find(p => p.slug === slug) || PILLARS[0];

  let allPosts = [];
  let avatarMap = new Map();
  try {
    [allPosts, avatarMap] = await Promise.all([
      fetchPublishedStories(),
      fetchAuthorAvatarMap()
    ]);
  } catch (err) {
    console.error('Could not load stories from Firestore:', err);
  }
  const posts = allPosts.filter(p => p.pillar === pillar.slug);

  // ---- Page header ----
  document.title = `${pillar.title} — Overview PH`;
  const descEl = document.getElementById('pageDescription');
  if (descEl) descEl.setAttribute('content', pillar.intro);

  document.getElementById('crumbPillar').textContent = pillar.title;
  document.getElementById('pillarTitle').textContent = pillar.title;
  document.getElementById('pillarIntro').textContent = pillar.intro;
  document.getElementById('pillarCount').textContent =
    posts.length === 1 ? '1 story' : `${posts.length} stories`;

  // ---- Story grid ----
  const grid = document.getElementById('archiveGrid');
  const empty = document.getElementById('archiveEmpty');

  if (posts.length === 0) {
    grid.hidden = true;
    empty.hidden = false;
    const otherPillars = PILLARS.filter(p => p.slug !== pillar.slug);
    document.getElementById('archiveEmptyPillars').innerHTML = otherPillars.map(p => `
      <a href="pillar.html?pillar=${p.slug}">${p.title}</a>
    `).join('');
  } else {
    grid.hidden = false;
    empty.hidden = true;
    grid.innerHTML = posts.map(s => `
      <article class="story-card reveal">
        <div class="story-card__media">
          <img src="${s.img}" alt="${s.title}" loading="lazy" onerror="this.style.display='none'">
          <span class="pill story-card__tag">${s.category}</span>
        </div>
        <h3><a href="story.html?slug=${s.id}">${s.title}</a></h3>
        <p class="story-card__excerpt">${s.excerpt}</p>
        <div class="story-card__meta">
          ${avatarMarkup(s.author, avatarMap)}
          <span>${s.author}</span>
          <span class="dot" aria-hidden="true"></span>
          <span>${s.dateLabel}</span>
          <span class="dot" aria-hidden="true"></span>
          <span>${s.read}</span>
        </div>
      </article>
    `).join('');
  }

  if (window.observeReveals) window.observeReveals();
});
