Drop real photography into this folder using the filenames below.
All of the site's HTML/CSS/JS already reference these paths — just
add the files and everything will pick them up automatically.

  hero-forest.jpg          Full-bleed homepage hero background
  cafe-spotlight.jpg       Café spotlight feature photo (4:3) — also
                            doubles as the Kalinaw Coffee House story hero
  creator-spotlight.jpg    Creator spotlight feature photo (4:3) — also
                            doubles as the Ifugao weaver story hero
  social-1.jpg … social-6.jpg   Instagram marquee tiles (1:1, six total)

Story cards / hero images (16:10), one per article — referenced from
assets/js/posts-data.js and used on the homepage, every pillar page,
the search page, and each story's own detail page:

  story-siargao.jpg          story-kakanin.jpg
  story-batanes.jpg          story-sinigang.jpg
  story-iloilo.jpg           story-empanada.jpg
  story-barako.jpg           story-basi.jpg
  story-baguio-cafes.jpg     story-manila-5am.jpg
  story-sagada.jpg           story-salt-farmers.jpg
  story-moriones.jpg         story-perspective-small-towns.jpg
  story-panday.jpg           story-perspective-slow-travel.jpg
  story-atiatihan.jpg        story-perspective-hidden-gem.jpg
  story-jeepney.jpg          story-ifugao-terraces.jpg
  story-midwife.jpg          story-marawi.jpg
  story-marine-biologist.jpg story-bataan.jpg

Horizontal-scroll gallery images (16:10) — only used on the four
flagship story pages that have the pinned photo-gallery section:

  story-siargao-gallery-1.jpg … story-siargao-gallery-4.jpg
  story-barako-gallery-1.jpg  … story-barako-gallery-4.jpg
  story-jeepney-gallery-1.jpg … story-jeepney-gallery-4.jpg
  story-bataan-gallery-1.jpg  … story-bataan-gallery-4.jpg

Until real photography is added, every image falls back to a
brand-colored gradient (see .story-card__media / .story-hero__bg /
.story-gallery__img in style.css), so the layout stays intentional
rather than showing broken image icons.

To add a new story: add an entry to the POSTS array in
assets/js/posts-data.js (title, excerpt, category, pillar slug,
image path, author, date, read time, body paragraphs, and an
optional pullQuote / gallery / stat). It automatically appears on
its pillar page, becomes searchable, and gets its own story.html
page at story.html?slug=<id> — no other file needs touching.
Add gallery + stat only for stories you want the full scrollytelling
treatment (pinned horizontal gallery + animated count-up stat).
