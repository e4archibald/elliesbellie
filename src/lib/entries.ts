import { getCollection, type CollectionEntry } from 'astro:content';
import { CATEGORIES, type CategorySlug } from '../data/categories';

export type Entry = CollectionEntry<'log'>;

/** Every published entry, newest first. Drafts are dropped in production. */
export async function allEntries(): Promise<Entry[]> {
  const entries = await getCollection('log', ({ data }) =>
    import.meta.env.PROD ? !data.draft : true,
  );
  return entries.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function entriesIn(slug: CategorySlug): Promise<Entry[]> {
  return (await allEntries()).filter((e) => e.data.category === slug);
}

/**
 * How far a print is turned as it lies on the page, in degrees, worked out
 * from its id. The same entry lies at the same angle on every page and in
 * every build, and nothing is ever quite straight — a print put down by hand
 * isn't. Pass a different `salt` for a second, unrelated number (the tape,
 * an offset) from the same id.
 */
export function tilt(id: string, max = 6, salt = ''): number {
  let h = 2166136261;
  for (const ch of id + salt) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const unit = ((h >>> 0) % 10000) / 10000; // 0 … 1
  let deg = (unit * 2 - 1) * max;
  if (Math.abs(deg) < max * 0.2) deg += Math.sign(deg || 1) * max * 0.25;
  return Math.round(deg * 10) / 10;
}

/** Each category with how many entries are filed in it, in page order. */
export async function drawers() {
  const entries = await allEntries();
  return CATEGORIES.map((category) => ({
    category,
    count: entries.filter((e) => e.data.category === category.slug).length,
  }));
}
