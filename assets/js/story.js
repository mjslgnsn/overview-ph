/* ============================================================
   OVERVIEW PH — STORY.JS
   Renders a single article from ?slug=, sourced live from
   Firestore for metadata (title, image, author, dates...) and
   from /stories/<slug>.html for the article body HTML — see
   data-service.js and stories/_TEMPLATE.html.
   ============================================================ */

import { PILLARS } from "./pillars-data.js";
import { fetchStoryBySlug, fetchStoryContent, fetchPublishedStories, fetchAuthorAvatarMap, avatarMarkup } from "./data-service.js";

document.addEventListener('DOMContentLoaded', async () => {

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  function rafThrottle(fn) {
    let ticking = false;
    return function (...args) {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          fn.apply(this, args);
          ticking = false;
        });
        ticking = true;
      }
    };
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!slug) {
    document.getElementById('storyTitle').textContent = 'Story not found';
    document.getElementById('storyBody').innerHTML =
      '<p class="story-p reveal">No story was specified. <a href="index.html">Return home</a>.</p>';
    return;
  }

  const post = await fetchStoryBySlug(slug).catch((err) => {
    console.error('Could not load story from Firestore:', err);
    return null;
  });

  const avatarMap = await fetchAuthorAvatarMap().catch(() => new Map());

  if (!post) {
    document.getElementById('storyTitle').textContent = 'Story not found';
    document.getElementById('storyLede').textContent = '';
    document.getElementById('storyBody').innerHTML =
      `<p class="story-p reveal">We couldn\u2019t find a published story at this address. It may have been unpublished, or the link may be out of date. <a href="search.html">Browse all stories</a>.</p>`;
    document.getElementById('storyGallerySection')?.setAttribute('hidden', '');
    return;
  }

  const pillar = PILLARS.find(p => p.slug === post.pillar);

  /* ---------------------------------------------------------
     1. Populate header / meta / hero
     --------------------------------------------------------- */
  document.title = `${post.title} — Overview PH`;
  const descEl = document.getElementById('pageDescription');
  if (descEl) descEl.setAttribute('content', post.excerpt);

  document.getElementById('storyTag').textContent = post.category;
  document.getElementById('storyTitle').textContent = post.title;
  document.getElementById('storyAuthor').textContent = post.author;
  document.getElementById('storyDate').textContent = post.dateLabel;
  document.getElementById('storyRead').textContent = post.read;

  const heroAvatarEl = document.getElementById('storyAuthorAvatar');
  if (heroAvatarEl) heroAvatarEl.outerHTML = avatarMarkup(post.author, avatarMap);

  const heroBg = document.getElementById('storyHeroBg');
  heroBg.style.backgroundImage =
    `linear-gradient(160deg, rgba(23,67,63,0.45), rgba(14,43,40,0.3)), url('${post.img}')`;

  document.getElementById('storyLede').textContent = post.excerpt;

  /* ---------------------------------------------------------
     2. Article body — fetched as raw HTML from
        stories/<slug>.html and injected directly. Write that
        file using the site's own classes (story-p, story-quote,
        story-stat, story-figure...) — see stories/_TEMPLATE.html.
     --------------------------------------------------------- */
  const bodyEl = document.getElementById('storyBody');
  bodyEl.innerHTML = await fetchStoryContent(slug);

  // Auto drop-cap the first paragraph and mark top-level blocks for
  // scroll-reveal, so authors don't have to add these classes by hand.
  const firstPara = bodyEl.querySelector('p');
  if (firstPara) firstPara.classList.add('story-p--dropcap');
  Array.from(bodyEl.children).forEach(el => el.classList.add('reveal'));

  /* ---------------------------------------------------------
     2b. Optional in-article pinned scroll gallery.
         Authors can drop this anywhere in their story HTML to
         get the "wow" horizontal-scroll photo moment mid-article:

           <div data-story-gallery="Optional Kicker Text">
             <figure>
               <img src="..." alt="...">
               <figcaption>Caption. Photo: Name / Unsplash.</figcaption>
             </figure>
             <figure>...</figure>
           </div>

         Everything before the marker stays in the main article
         body; everything after it is moved into a second article
         section that renders below the gallery, so the gallery
         sits "in the middle" of the story instead of at the end.
     --------------------------------------------------------- */
  const gallerySection = document.getElementById('storyGallerySection');
  const galleryTrack = document.getElementById('storyGalleryTrack');
  const galleryMarker = bodyEl.querySelector('[data-story-gallery]');

  if (galleryMarker && gallerySection && galleryTrack) {
    const figures = Array.from(galleryMarker.querySelectorAll('figure'));

    galleryTrack.innerHTML = figures.map(fig => {
      const img = fig.querySelector('img');
      const caption = fig.querySelector('figcaption');
      const src = img ? img.getAttribute('src') : '';
      const alt = img ? (img.getAttribute('alt') || '') : '';
      const captionHtml = caption ? caption.innerHTML : '';
      return `
        <figure class="story-gallery__item">
          <div class="story-gallery__img" role="img" aria-label="${alt.replace(/"/g, '&quot;')}" style="background-image: url('${src}');"></div>
          <figcaption>${captionHtml}</figcaption>
        </figure>`;
    }).join('');

    const kickerEl = gallerySection.querySelector('.story-gallery__kicker');
    if (kickerEl) {
      const kickerText = galleryMarker.getAttribute('data-story-gallery');
      if (kickerText) kickerEl.textContent = kickerText;
    }

    // Move everything that came after the marker into a new
    // "continued" article section, then drop the marker itself.
    const continuedBody = document.createElement('div');
    continuedBody.className = 'story-article__body';
    while (galleryMarker.nextSibling) {
      continuedBody.appendChild(galleryMarker.nextSibling);
    }
    galleryMarker.remove();

    gallerySection.hidden = false;

    if (continuedBody.childNodes.length) {
      const continuedSection = document.createElement('section');
      continuedSection.className = 'story-article story-article--continued';
      continuedSection.innerHTML = '<aside class="story-share" aria-hidden="true"></aside>';
      continuedSection.appendChild(continuedBody);
      gallerySection.after(continuedSection);
    }

    // Pinned horizontal-scroll behavior (desktop); becomes a plain
    // swipeable strip on narrow screens via the CSS breakpoint.
    const setGalleryHeight = () => {
      if (window.innerWidth >= 900) {
        const extra = Math.max(galleryTrack.scrollWidth - window.innerWidth, 0);
        gallerySection.style.height = `calc(100vh + ${extra}px)`;
      } else {
        gallerySection.style.height = 'auto';
        galleryTrack.style.transform = 'none';
      }
    };
    const updateGalleryScroll = () => {
      if (window.innerWidth < 900) return;
      const rect = gallerySection.getBoundingClientRect();
      const scrollable = gallerySection.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const progress = Math.min(Math.max(-rect.top / scrollable, 0), 1);
      const maxTranslate = Math.max(galleryTrack.scrollWidth - window.innerWidth, 0);
      galleryTrack.style.transform = `translate3d(-${progress * maxTranslate}px, 0, 0)`;
    };
    window.addEventListener('load', setGalleryHeight);
    window.addEventListener('resize', () => { setGalleryHeight(); updateGalleryScroll(); });
    window.addEventListener('scroll', rafThrottle(updateGalleryScroll), { passive: true });
    setGalleryHeight();
    updateGalleryScroll();
  } else {
    // No gallery marker in this story's content — keep the section
    // hidden, same as before.
    gallerySection?.setAttribute('hidden', '');
  }

  /* ---------------------------------------------------------
     3. Related stories — same pillar, excluding this one
     --------------------------------------------------------- */
  document.getElementById('relatedHeading').textContent = `More from ${pillar ? pillar.title : 'Overview PH'}`;
  let related = [];
  try {
    const allPosts = await fetchPublishedStories();
    related = allPosts.filter(p => p.pillar === post.pillar && p.id !== post.id).slice(0, 3);
  } catch (err) {
    console.error('Could not load related stories:', err);
  }
  const relatedGrid = document.getElementById('relatedGrid');
  relatedGrid.innerHTML = related.map(s => `
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

  /* ---------------------------------------------------------
     4. Reading progress bar
     --------------------------------------------------------- */
  const progressBar = document.getElementById('readProgress');
  const updateProgress = () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    progressBar.style.width = `${Math.min(Math.max(pct, 0), 100)}%`;
  };
  window.addEventListener('scroll', rafThrottle(updateProgress), { passive: true });
  updateProgress();

  /* ---------------------------------------------------------
     5. Parallax hero image
     --------------------------------------------------------- */
  if (!prefersReducedMotion) {
    const hero = document.getElementById('storyHero');
    const updateParallax = () => {
      const heroHeight = hero.offsetHeight;
      const y = window.scrollY;
      if (y > heroHeight) return;
      const progress = y / heroHeight;
      heroBg.style.transform = `translate3d(0, ${y * 0.35}px, 0) scale(${1 + progress * 0.12})`;
    };
    window.addEventListener('scroll', rafThrottle(updateParallax), { passive: true });
    updateParallax();
  }

  /* ---------------------------------------------------------
     6. Animated stat count-up — triggers automatically on any
        .story-stat__value[data-target] the author included in
        their article HTML.
     --------------------------------------------------------- */
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const duration = prefersReducedMotion ? 0 : 1100;
      const start = performance.now();

      function tick(now) {
        const t = duration === 0 ? 1 : Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
        const value = Math.round(target * eased);
        el.textContent = `${value}${suffix}`;
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      statObserver.unobserve(el);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('.story-stat__value').forEach(el => statObserver.observe(el));

  /* ---------------------------------------------------------
     7. Share rail — copy link + bookmark
     --------------------------------------------------------- */
  const shareCopy = document.getElementById('shareCopy');
  const shareNote = document.getElementById('shareNote');
  let noteTimer;
  shareCopy?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      shareNote.textContent = 'Link copied';
    } catch (err) {
      shareNote.textContent = window.location.href;
    }
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => { shareNote.textContent = ''; }, 2200);
  });

  const shareSave = document.getElementById('shareSave');
  shareSave?.addEventListener('click', () => {
    const isSaved = shareSave.classList.toggle('is-saved');
    shareSave.setAttribute('aria-pressed', String(isSaved));
    shareSave.querySelector('path').setAttribute('fill', isSaved ? 'currentColor' : 'none');
  });

  /* ---------------------------------------------------------
     8. Re-scan for scroll-reveal targets injected above
     --------------------------------------------------------- */
  if (window.observeReveals) window.observeReveals();
});
