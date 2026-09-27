import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const projects = defineCollection({
  loader: glob({ pattern: "**/index.mdx", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      publishDate: z.coerce.date(),
      thumbnail: image(),
      categories: z.array(z.string()).default([]),
    }),
});

const notes = defineCollection({
  loader: glob({ pattern: "**/index.mdx", base: "./src/content/notes" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    // Drafts render in `astro dev` but are left out of production builds.
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects, notes };
