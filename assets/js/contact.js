/* ============================================================
   OVERVIEW PH — CONTACT.JS
   Renders the Contributors grid on contact.html from real
   publishing history — every author who has at least one
   published story in Firestore, with their story count and the
   pillars they write for. No hand-maintained names; an author
   only appears here once they've actually published something.
   ============================================================ */

import { fetchContributors, fetchPublishedStories, computeSiteStats, renderSiteStats } from "./data-service.js";

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

document.addEventListener('DOMContentLoaded', async () => {
  /* ---------------------------------------------------------
     ABOUT SECTION STATS — same real numbers as the homepage,
     replacing the old hardcoded "50+ / 100+ / 30+" placeholders.
     --------------------------------------------------------- */
  try {
    const posts = await fetchPublishedStories();
    renderSiteStats(computeSiteStats(posts));
  } catch (err) {
    console.error('Could not load stories from Firestore for About stats:', err);
  }

  const grid = document.getElementById('contributorsGrid');
  if (!grid) return;
  const emptyNote = document.getElementById('contributorsEmpty');

  let contributors = [];
  try {
    contributors = await fetchContributors();
  } catch (err) {
    console.error('Could not load contributors from Firestore:', err);
  }

  if (contributors.length === 0) {
    grid.hidden = true;
    if (emptyNote) emptyNote.hidden = false;
    if (window.observeReveals) window.observeReveals();
    return;
  }

  grid.hidden = false;
  if (emptyNote) emptyNote.hidden = true;

  grid.innerHTML = contributors.map((c) => {
    const avatar = c.avatarUrl
      ? `<img class="contributor-card__avatar contributor-card__avatar--photo" src="${c.avatarUrl}" alt="" loading="lazy" onerror="this.outerHTML='&lt;span class=&quot;contributor-card__avatar&quot; aria-hidden=&quot;true&quot;&gt;&lt;/span&gt;'">`
      : `<span class="contributor-card__avatar" aria-hidden="true"></span>`;
    const role = c.categories.length ? c.categories.slice(0, 2).join(' & ') : 'Contributor';
    const storyWord = c.count === 1 ? 'story' : 'stories';

    return `
      <div class="contributor-card reveal">
        ${avatar}
        <span class="contributor-card__name">${escapeHtml(c.name)}</span>
        <span class="contributor-card__role">${escapeHtml(role)}</span>
        <p class="contributor-card__bio">${c.count} published ${storyWord}</p>
      </div>
    `;
  }).join('');

  if (window.observeReveals) window.observeReveals();
});
