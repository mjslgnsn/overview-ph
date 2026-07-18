/* ============================================================
   OVERVIEW PH — SHARED CONTENT DATA
   Loaded before site.js / main.js / pillar.js / search.js /
   story.js on every page. Plain top-level consts so later
   classic <script> tags on the same page can read them directly.
   ============================================================ */

export const PILLARS = [
  {
    slug: 'places',
    title: 'Places',
    desc: 'Towns, islands, and neighborhoods worth the detour.',
    intro: 'The towns and islands that don\u2019t make the top-ten lists \u2014 and why they should.'
  },
  {
    slug: 'coffee-cafes',
    title: 'Coffee & Caf\u00e9s',
    desc: 'The people behind the cup, one roast at a time.',
    intro: 'Roasters, baristas, and the small rituals that keep a neighborhood cafe running.'
  },
  {
    slug: 'culture',
    title: 'Culture',
    desc: 'Traditions, rituals, and the stories that carry them.',
    intro: 'Festivals, crafts, and inherited knowledge \u2014 documented while the people who hold it are still around to explain it.'
  },
  {
    slug: 'people',
    title: 'People',
    desc: 'Portraits of Filipinos shaping their communities.',
    intro: 'Profiles of the people doing the quiet, unglamorous work of holding a community together.'
  },
  {
    slug: 'food',
    title: 'Food',
    desc: 'Recipes, kitchens, and the meals that hold memory.',
    intro: 'What we cook, why we cook it that way, and who taught us.'
  },
  {
    slug: 'photo-essays',
    title: 'Photo Essays',
    desc: 'Visual stories told frame by frame.',
    intro: 'Stories that needed a camera more than a byline.'
  },
  {
    slug: 'perspectives',
    title: 'Perspectives',
    desc: 'Opinion and reflection from writers on the ground.',
    intro: 'Opinion, reflection, and the occasional disagreement \u2014 from writers who report before they argue.'
  },
  {
    slug: 'features',
    title: 'Features',
    desc: 'Long-form reporting on the country in motion.',
    intro: 'The longer reads \u2014 reported over weeks, not afternoons.'
  }
];
