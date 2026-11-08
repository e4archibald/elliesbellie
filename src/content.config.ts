import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORY_SLUGS } from './data/categories';

const log = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/log' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      category: z.enum(CATEGORY_SLUGS),
      /** Small mono line above the title — "FILM · 35MM", "1,400 WORDS". */
      kicker: z.string(),
      /** One or two sentences. Used on the strip, the rail and the log. */
      blurb: z.string(),
      /** Optional. Without one, the hatched placeholder stands in. */
      image: image().optional(),
      imageAlt: z.string().optional(),
      /**
       * Optional. Several images shown together on the entry page, in this
       * order — the stages of one drawing, a run of frames. `image` is still
       * the one that stands for the entry everywhere else (the strip, the
       * cards, the log), so it is usually one of these as well.
       */
      gallery: z
        .array(
          z.object({
            image: image(),
            alt: z.string(),
            /** A few words under the image — "Construction lines". */
            caption: z.string().optional(),
          }),
        )
        .optional(),
      /** Text shown inside the placeholder when there is no image. */
      slot: z.string().default('no image yet'),
      draft: z.boolean().default(false),
    }),
});

export const collections = { log };
