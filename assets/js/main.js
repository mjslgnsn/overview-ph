/* ============================================================
   OVERVIEW PH — MAIN.JS  (homepage-only)
   Content pillars grid, featured stories, interactive map,
   social marquee. Shared nav/search/newsletter/reveal logic
   lives in site.js. Story data is fetched live from Firestore
   via data-service.js — see that file for the schema.
   ============================================================ */

import { PILLARS } from "./pillars-data.js";
import { fetchPublishedStories, fetchSpotlightStories, fetchAuthorAvatarMap, avatarMarkup } from "./data-service.js";
import { initMap } from "./map.js";

document.addEventListener('DOMContentLoaded', async () => {

  /* ---------------------------------------------------------
     1. CONTENT PILLARS — render 8 cards, each linking to its
        pillar listing page
     --------------------------------------------------------- */
  const pillarsGrid = document.getElementById('pillarsGrid');
  if (pillarsGrid) {
    pillarsGrid.innerHTML = PILLARS.map(p => `
      <a class="pillar-card reveal" href="pillar.html?pillar=${p.slug}">
        <div class="pillar-card__dot" aria-hidden="true"></div>
        <h3>${p.title}</h3>
        <p>${p.desc}</p>
      </a>
    `).join('');
  }

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

  /* ---------------------------------------------------------
     HERO CAROUSEL — auto-sliding, built from the hero images of
     the latest published stories. Falls back to the single
     static forest photo already in the markup when there are no
     stories yet (or Firestore can't be reached), so the hero
     never shows blank.
     --------------------------------------------------------- */
  const heroBgWrap = document.getElementById('heroBg');
  if (heroBgWrap && allPosts.length > 0) {
    const slides = allPosts.slice(0, 6);
    heroBgWrap.innerHTML = slides.map((s, i) => `
      <div class="hero__slide${i === 0 ? ' is-active' : ''}" style="background-image:linear-gradient(160deg, rgba(23,67,63,0.55), rgba(14,43,40,0.35)), url('${s.img}')" role="img" aria-label="${s.title}"></div>
    `).join('');

    if (slides.length > 1) {
      let current = 0;
      const slideEls = heroBgWrap.querySelectorAll('.hero__slide');
      setInterval(() => {
        slideEls[current].classList.remove('is-active');
        current = (current + 1) % slideEls.length;
        slideEls[current].classList.add('is-active');
      }, 6000);
    }
  }

  /* ---------------------------------------------------------
     2. FEATURED STORIES — render cards + bookmark toggle
        "Latest Stories" = whatever's flagged Featured in Studio,
        falling back to the most recent releases if nothing is
        flagged yet, so the section is never empty.
     --------------------------------------------------------- */
  const storiesGrid = document.getElementById('storiesGrid');
  if (storiesGrid) {
    let featured = allPosts.filter(p => p.featured);
    if (featured.length === 0) featured = allPosts.slice(0, 6);

    if (featured.length === 0) {
      storiesGrid.innerHTML = `<p class="empty-note">No stories published yet — publish one in Overview Studio and it will appear here automatically.</p>`;
    } else {
      storiesGrid.innerHTML = featured.map((s, i) => `
        <article class="story-card reveal">
          <div class="story-card__media">
            <img src="${s.img}" alt="${s.title}" loading="lazy" onerror="this.style.display='none'">
            <span class="pill story-card__tag">${s.category}</span>
            <button class="story-card__save" data-index="${i}" aria-label="Save story" aria-pressed="false">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
            </button>
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

      // Bookmark state kept in-memory only (no localStorage per spec)
      const savedStories = [];
      storiesGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.story-card__save');
        if (!btn) return;
        const idx = Number(btn.dataset.index);
        const isSaved = btn.classList.toggle('is-saved');
        btn.setAttribute('aria-pressed', String(isSaved));
        if (isSaved) {
          savedStories.push(idx);
          btn.querySelector('path').setAttribute('fill', 'currentColor');
        } else {
          const pos = savedStories.indexOf(idx);
          if (pos > -1) savedStories.splice(pos, 1);
          btn.querySelector('path').setAttribute('fill', 'none');
        }
      });
    }
  }

  /* ---------------------------------------------------------
     3. SPOTLIGHT — "Local Business of the Month" / "Creator
        Spotlight" pull from whichever published stories were
        flagged with that Spotlight slot in Studio. If nothing's
        flagged yet, the whole section is hidden rather than
        showing stale placeholder copy.
     --------------------------------------------------------- */
  const spotlightSection = document.getElementById('spotlight');
  if (spotlightSection) {
    try {
      const { business, creator } = await fetchSpotlightStories();
      const panels = spotlightSection.querySelectorAll('.spotlight');
      const fill = (panel, story, tagLabel) => {
        if (!story) { panel.hidden = true; panel.style.display = 'none'; return; }
        panel.hidden = false;
        panel.style.display = '';
        const img = panel.querySelector('.spotlight__media img');
        if (img) { img.src = story.img; img.alt = story.title; }
        const tag = panel.querySelector('.pill--outline');
        if (tag) tag.textContent = tagLabel;
        const heading = panel.querySelector('.spotlight__body h2');
        if (heading) heading.textContent = story.title;
        // Only one paragraph of real copy exists per story (the excerpt) —
        // fill the first <p> with it and remove any other static <p> left
        // over in the markup so no old placeholder copy can survive.
        const paras = panel.querySelectorAll('.spotlight__body p:not(.pill)');
        paras.forEach((p, i) => {
          if (i === 0) p.textContent = story.excerpt;
          else p.remove();
        });
        const link = panel.querySelector('.link-arrow');
        if (link) link.setAttribute('href', `story.html?slug=${story.id}`);
      };
      if (panels[0]) fill(panels[0], business, 'Local Business of the Month');
      if (panels[1]) fill(panels[1], creator, 'Creator Spotlight');
      if (!business && !creator) { spotlightSection.hidden = true; spotlightSection.style.display = 'none'; }
    } catch (err) {
      console.error('Could not load spotlight stories:', err);
      spotlightSection.hidden = true;
      spotlightSection.style.display = 'none';
    }
  }

  /* ---------------------------------------------------------
     4. INTERACTIVE MAP — only stories with lat/lng set in Studio
     --------------------------------------------------------- */
  initMap(allPosts, PILLARS);

  /* ---------------------------------------------------------
     5. SOCIAL STRIP — render tiles, duplicated for a seamless
        infinite marquee (CSS animates track from 0% to -50%)
     --------------------------------------------------------- */
  const socialRow = document.getElementById('socialRow');
  if (socialRow) {
    const socialTiles = [1, 2, 3, 4, 5, 6];
    const tileMarkup = (n) => `
      <a href="#" class="social-tile" aria-label="View post on Instagram">
        <img src="assets/img/social-${n}.jpg" alt="Overview PH Instagram post ${n}" loading="lazy" onerror="this.style.display='none'">
        <span class="social-tile__overlay">
          <svg viewBox="0 0 24 24" width="26" height="26"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor"/></svg>
        </span>
      </a>
    `;
    // Render the set twice back-to-back so the -50% translate loops seamlessly
    socialRow.innerHTML = socialTiles.map(tileMarkup).join('') + socialTiles.map(tileMarkup).join('');
  }

  /* ---------------------------------------------------------
     6. Re-scan for scroll-reveal targets injected above
     --------------------------------------------------------- */
  if (window.observeReveals) window.observeReveals();

});
