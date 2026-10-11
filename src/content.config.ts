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

// Optional build write-up for a project: src/content/projects/<slug>/build.mdx.
// Shown on its own page (/projects/<slug>/build), linked from the project, so
// the project page can stay about the project itself.
const builds = defineCollection({
  loader: glob({ pattern: "**/build.mdx", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
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

export const collections = { projects, builds, notes };
