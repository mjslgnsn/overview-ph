/* ============================================================
   OVERVIEW PH — SEARCH.JS
   Reads ?q=<query> and renders matching stories, sourced live
   from Firestore. With no query present, this page doubles as
   a "browse all stories" archive.
   ============================================================ */

import { PILLARS } from "./pillars-data.js";
import { fetchPublishedStories, fetchAuthorAvatarMap, avatarMarkup } from "./data-service.js";

document.addEventListener('DOMContentLoaded', async () => {

  function searchPosts(posts, query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return posts
      .map(post => {
        const title = post.title.toLowerCase();
        const excerpt = post.excerpt.toLowerCase();
        const category = post.category.toLowerCase();
        const author = post.author.toLowerCase();
        let score = 0;
        if (title.startsWith(q)) score += 100;
        else if (title.includes(q)) score += 60;
        if (category.includes(q)) score += 40;
        if (author.includes(q)) score += 25;
        if (excerpt.includes(q)) score += 15;
        return { post, score };
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(r => r.post);
  }

  const params = new URLSearchParams(window.location.search);
  const query = params.get('q') || '';

  const searchTitle = document.getElementById('searchTitle');
  const searchIntro = document.getElementById('searchIntro');
  const crumbLabel = document.getElementById('crumbLabel');
  const searchCount = document.getElementById('searchCount');
  const grid = document.getElementById('archiveGrid');
  const empty = document.getElementById('archiveEmpty');
  const pageSearchInput = document.getElementById('pageSearchInput');
  const pageSearchForm = document.getElementById('pageSearchForm');

  if (pageSearchInput) pageSearchInput.value = query;

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

  let results;
  if (query.trim()) {
    results = searchPosts(allPosts, query);
    document.title = `Search: ${query} — Overview PH`;
    crumbLabel.textContent = 'Search';
    searchTitle.textContent = `Search results for \u201c${query}\u201d`;
    searchIntro.textContent = results.length
      ? `Found ${results.length} ${results.length === 1 ? 'story' : 'stories'} matching your search.`
      : 'We couldn\u2019t find a story that matches — try another word, or browse by pillar below.';
  } else {
    results = [...allPosts]; // already ordered newest-first by Firestore query
    document.title = 'All Stories — Overview PH';
    crumbLabel.textContent = 'All Stories';
    searchTitle.textContent = 'All Stories';
    searchIntro.textContent = 'Every story published on Overview PH, newest first.';
  }

  searchCount.textContent = results.length === 1 ? '1 story' : `${results.length} stories`;

  if (results.length === 0) {
    grid.hidden = true;
    empty.hidden = false;
    document.getElementById('archiveEmptyPillars').innerHTML = PILLARS.map(p => `
      <a href="pillar.html?pillar=${p.slug}">${p.title}</a>
    `).join('');
  } else {
    grid.hidden = false;
    empty.hidden = true;
    grid.innerHTML = results.map(s => `
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

  if (pageSearchForm) {
    pageSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = pageSearchInput.value.trim();
      window.location.href = value ? `search.html?q=${encodeURIComponent(value)}` : 'search.html';
    });
  }
});
