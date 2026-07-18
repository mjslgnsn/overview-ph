/* ============================================================
   OVERVIEW PH — MAP.JS
   Interactive map for the "Where We've Been" section, built on
   Leaflet.js (self-hosted, no API key) + free CartoDB basemap
   tiles. Shows one pin per real-world place covered in POSTS,
   styled to match the site's forest/cream/gold theme, with
   category filter chips and a themed popup.

   ------------------------------------------------------------
   NO API KEY, NO SIGNUP, NO BILLING ACCOUNT REQUIRED.
   Leaflet itself is self-hosted at assets/vendor/leaflet/ (MIT
   licensed, no key). The only network dependency at runtime is
   the basemap tile images themselves, served free by CartoDB /
   OpenStreetMap contributors under their standard attribution
   requirement (kept visible in the map's bottom-right corner —
   please don't remove it, it's what keeps the tiles free).

   If you ever want Google's photorealistic 3D tiles instead,
   that requires a billing-enabled Google Cloud project (Google
   does not issue a permanent free API key) — this file can be
   swapped back to that version if you decide it's worth it.
   ------------------------------------------------------------
   Exports initMap(posts, pillars) — called from main.js once
   published stories have been fetched from Firestore.
   ============================================================ */

const PH_CENTER = [12.35, 122.5];
const PH_BOUNDS = [[3, 114], [22, 129]]; // [southwest, northeast]

let overviewMap = null;
let overviewMarkers = []; // { marker, pillarSlugs: Set, place }

/* ---------------------------------------------------------
   Group POSTS by physical place so multiple stories at the
   same location share one pin instead of stacking.
   --------------------------------------------------------- */
function groupPostsByPlace(posts) {
  const groups = new Map();
  posts.forEach(post => {
    if (!post.place) return; // editorial posts with no specific place are skipped
    const key = post.place.name;
    if (!groups.has(key)) {
      groups.set(key, { name: post.place.name, lat: post.place.lat, lng: post.place.lng, posts: [] });
    }
    groups.get(key).posts.push(post);
  });
  return Array.from(groups.values());
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/* Gold pin, matching the brand — drawn as an inline SVG data URL so no image asset is needed */
function pinIcon(count) {
  const size = count > 1 ? 40 : 34;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="17" fill="#C89A4B" stroke="#0E2B28" stroke-width="2.5"/>
      <circle cx="20" cy="20" r="7" fill="#0E2B28"/>
    </svg>
  `;
  return L.icon({
    iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

function buildPopupContent(group) {
  const storyRows = group.posts.map(p => `
    <a class="gmap-iw__story" href="story.html?slug=${p.id}">
      <span class="gmap-iw__pill">${escapeHtml(p.category)}</span>
      <span class="gmap-iw__title">${escapeHtml(p.title)}</span>
    </a>
  `).join('');

  return `
    <div class="gmap-iw">
      <div class="gmap-iw__place">${escapeHtml(group.name)}</div>
      <div class="gmap-iw__count">${group.posts.length} ${group.posts.length === 1 ? 'story' : 'stories'}</div>
      <div class="gmap-iw__list">${storyRows}</div>
    </div>
  `;
}

/* ---------------------------------------------------------
   Category filter chips — toggle marker visibility by pillar
   --------------------------------------------------------- */
function renderFilterChips(container, posts, pillars) {
  const usedSlugs = new Set(posts.filter(p => p.place).map(p => p.pillar));
  const chips = pillars.filter(p => usedSlugs.has(p.slug));

  container.innerHTML = `<button class="gmap-chip is-active" data-slug="all">All Coverage</button>` +
    chips.map(p => `<button class="gmap-chip" data-slug="${p.slug}">${p.title}</button>`).join('');

  container.addEventListener('click', (e) => {
    const chip = e.target.closest('.gmap-chip');
    if (!chip) return;
    const slug = chip.dataset.slug;

    container.querySelectorAll('.gmap-chip').forEach(c => c.classList.remove('is-active'));
    chip.classList.add('is-active');

    overviewMarkers.forEach(({ marker, pillarSlugs }) => {
      const visible = slug === 'all' || pillarSlugs.has(slug);
      if (visible && !overviewMap.hasLayer(marker)) marker.addTo(overviewMap);
      if (!visible && overviewMap.hasLayer(marker)) overviewMap.removeLayer(marker);
    });
  });
}

/* ---------------------------------------------------------
   Graceful fallback if Leaflet failed to load, or tiles can't
   be reached (e.g. no network).
   --------------------------------------------------------- */
function showMapError(message) {
  const mapEl = document.getElementById('gmap');
  if (!mapEl) return;
  document.getElementById('gmapLoading')?.remove();
  mapEl.innerHTML = `
    <div class="gmap-fallback">
      <p class="gmap-fallback__title">Map unavailable</p>
      <p class="gmap-fallback__msg">${escapeHtml(message)}</p>
    </div>
  `;
}

/* ---------------------------------------------------------
   Init — runs once the DOM (and Leaflet, loaded via a normal
   <script> tag before this file) is ready.
   --------------------------------------------------------- */
export function initMap(posts, pillars) {
  const mapEl = document.getElementById('gmap');
  if (!mapEl) return;

  if (typeof L === 'undefined') {
    showMapError('The map library didn\u2019t load. Check that assets/vendor/leaflet/leaflet.js is present.');
    return;
  }

  overviewMap = L.map(mapEl, {
    center: PH_CENTER,
    zoom: 6,
    minZoom: 5,
    maxZoom: 15,
    maxBounds: PH_BOUNDS,
    maxBoundsViscosity: 0.6,
    zoomControl: true,
    attributionControl: true
  });

  // Free CartoDB "Positron" tiles — light, low-saturation base that
  // sits well under our brand colors. No API key required; the
  // attribution line is part of the free-usage terms, please keep it.
  const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  });
  tileLayer.addTo(overviewMap);

  let tileLoadCount = 0;
  let tileErrorCount = 0;
  tileLayer.on('load', () => {
    document.getElementById('gmapLoading')?.remove();
  });
  tileLayer.on('tileload', () => { tileLoadCount++; });
  tileLayer.on('tileerror', () => { tileErrorCount++; });

  // Give the map a few seconds to prove at least one tile can load.
  // A handful of edge-tile 404s is normal even on a healthy connection,
  // so only show the fallback if literally nothing rendered.
  setTimeout(() => {
    document.getElementById('gmapLoading')?.remove();
    if (tileLoadCount === 0 && tileErrorCount > 0) {
      showMapError('Map tiles couldn\u2019t be reached. Check your internet connection.');
    }
  }, 6000);

  const groups = groupPostsByPlace(posts);

  if (groups.length === 0) {
    showMapError('No stories have map coordinates yet \u2014 add a Map Pin Name, Latitude, and Longitude to a story in Studio to plot it here.');
    return;
  }

  groups.forEach(group => {
    const pillarSlugs = new Set(group.posts.map(p => p.pillar));
    const marker = L.marker([group.lat, group.lng], {
      icon: pinIcon(group.posts.length),
      title: group.name,
      riseOnHover: true
    });
    marker.bindPopup(buildPopupContent(group), { maxWidth: 280, className: 'gmap-popup' });
    marker.addTo(overviewMap);
    overviewMarkers.push({ marker, pillarSlugs, place: group });
  });

  const chipRow = document.getElementById('gmapFilters');
  if (chipRow) renderFilterChips(chipRow, posts, pillars);

  const countEl = document.getElementById('gmapCount');
  if (countEl) {
    const totalStories = groups.reduce((sum, g) => sum + g.posts.length, 0);
    countEl.textContent = `${groups.length} places \u00b7 ${totalStories} stories mapped`;
  }
}
