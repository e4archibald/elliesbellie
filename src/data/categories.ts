/**
 * The five strips on the homepage. Order here is the order on the page.
 *
 * Counts and featured items are NOT stored here — they are derived from the
 * entries in src/content/log, so the numbers on the page are always true.
 */
export const CATEGORIES = [
  {
    slug: 'photography',
    name: 'PHOTOGRAPHY',
    label: 'Photography, on film',
    blurb: 'Portra 400, mostly. Taken while waiting for someone who did not come, and better for it.',
  },
  {
    slug: 'drawing',
    name: 'DRAWING',
    label: 'Drawing, in pencil',
    blurb: 'Hatching is only a way of deciding where light is absent. Studies, sheets, and failures.',
  },
  {
    slug: 'essays',
    name: 'ESSAYS',
    label: 'Essays, on whatever',
    blurb: 'Any instrument worth keeping resists being hurried. The argument is self-serving.',
  },
  {
    slug: 'electronics',
    name: 'ELECTRONICS',
    label: 'Electronics & lasers',
    blurb: 'Build notes, schematics, and an honest account of what went wrong first.',
  },
  {
    slug: 'found',
    name: 'FOUND',
    label: 'Found things',
    blurb: "Advertisements, diagrams, offcuts, other people's better ideas. Filed loosely.",
  },
] as const;

export type Category = (typeof CATEGORIES)[number];
export type CategorySlug = Category['slug'];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as unknown as [
  CategorySlug,
  ...CategorySlug[],
];

export const categoryBySlug = (slug: string): Category | undefined =>
  CATEGORIES.find((c) => c.slug === slug);
