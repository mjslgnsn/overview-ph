/* ============================================================
   OVERVIEW PH — SITE.JS
   Shared across every page: nav, mobile menu, search engine,
   scroll-reveal, footer year. Newsletter subscribe widgets now
   live in subscribe.js. Story data for the nav search dropdown
   is fetched live from Firestore via data-service.js.
   ============================================================ */

import { fetchPublishedStories } from "./data-service.js";

document.addEventListener('DOMContentLoaded', async () => {

  // Fetched once and reused by the nav search dropdown below.
  let allPosts = [];
  try {
    allPosts = await fetchPublishedStories();
  } catch (err) {
    console.error('Could not load stories from Firestore:', err);
  }

  /* ---------------------------------------------------------
     1. STICKY NAV — background/blur toggle on scroll
     --------------------------------------------------------- */
  const nav = document.getElementById('nav');
  if (nav) {
    const toggleNavState = () => {
      if (window.scrollY > 60) {
        nav.classList.add('is-scrolled');
      } else {
        nav.classList.remove('is-scrolled');
      }
    };
    toggleNavState();
    window.addEventListener('scroll', toggleNavState, { passive: true });
  }

  /* ---------------------------------------------------------
     2. MOBILE MENU toggle
     --------------------------------------------------------- */
  const burger = document.getElementById('burger');
  const navMobile = document.getElementById('navMobile');
  if (burger && navMobile) {
    burger.addEventListener('click', () => {
      const isOpen = navMobile.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(isOpen));
    });
    navMobile.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMobile.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------------------------------------------------------
     3. SEARCH — live dropdown + submit to search.html?q=
     --------------------------------------------------------- */
  const searchToggle = document.getElementById('searchToggle');
  const navSearch = document.getElementById('navSearch');
  const searchInput = document.getElementById('navSearchInput');
  const searchResults = document.getElementById('navSearchResults');

  if (searchToggle && navSearch) {
    searchToggle.addEventListener('click', () => {
      const isOpen = navSearch.classList.toggle('is-open');
      searchToggle.setAttribute('aria-expanded', String(isOpen));
      navSearch.setAttribute('aria-hidden', String(!isOpen));
      if (isOpen && searchInput) searchInput.focus();
      if (!isOpen) closeSearchResults();
    });
  }

  function closeSearchResults() {
    if (!searchResults) return;
    searchResults.hidden = true;
    searchResults.innerHTML = '';
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function highlightMatch(text, query) {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return escapeHtml(text);
    const before = escapeHtml(text.slice(0, idx));
    const match = escapeHtml(text.slice(idx, idx + query.length));
    const after = escapeHtml(text.slice(idx + query.length));
    return `${before}<mark>${match}</mark>${after}`;
  }

  // Simple relevance-scored search across title / excerpt / category / author
  function searchPosts(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allPosts
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

  function renderSearchDropdown(query) {
    if (!searchResults) return;
    const matches = searchPosts(query).slice(0, 6);

    if (!query.trim()) {
      closeSearchResults();
      return;
    }

    if (matches.length === 0) {
      searchResults.innerHTML = `<p class="nav__search-empty">No stories found for &ldquo;${escapeHtml(query)}&rdquo;.</p>`;
      searchResults.hidden = false;
      return;
    }

    searchResults.innerHTML = matches.map(post => `
      <a href="story.html?slug=${post.id}" class="nav__search-result">
        <span class="nav__search-result__title">${highlightMatch(post.title, query)}</span>
        <span class="nav__search-result__meta">${escapeHtml(post.category)}</span>
      </a>
    `).join('') + `
      <a href="search.html?q=${encodeURIComponent(query)}" class="nav__search-viewall">See all results for &ldquo;${escapeHtml(query)}&rdquo; \u2192</a>
    `;
    searchResults.hidden = false;
  }

  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const value = searchInput.value;
      debounceTimer = setTimeout(() => renderSearchDropdown(value), 120);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const value = searchInput.value.trim();
        if (value) window.location.href = `search.html?q=${encodeURIComponent(value)}`;
      } else if (e.key === 'Escape') {
        closeSearchResults();
        searchInput.blur();
      }
    });

    document.addEventListener('click', (e) => {
      if (navSearch && !navSearch.contains(e.target) && e.target !== searchToggle) {
        closeSearchResults();
      }
    });
  }

  /* ---------------------------------------------------------
     4. SMOOTH SCROLL for in-page nav anchors (same-page only)
     --------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  /* ---------------------------------------------------------
     5. SCROLL-REVEAL — IntersectionObserver with stagger.
        Exposed as window.observeReveals() so pages can re-run
        it after injecting dynamic content.
     --------------------------------------------------------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('is-visible'), i * 60);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  window.observeReveals = function () {
    document.querySelectorAll('.reveal:not(.reveal-bound)').forEach(el => {
      el.classList.add('reveal-bound');
      revealObserver.observe(el);
    });
  };
  window.observeReveals();

  /* ---------------------------------------------------------
     6. FOOTER YEAR
     --------------------------------------------------------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

});
