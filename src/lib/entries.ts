import { getImage } from "astro:assets";
import type { ImageMetadata } from "astro";
import type { Entry } from "../components/EntryList.astro";
import { slugOf, type Note, type Project } from "./content";

async function thumb(image?: ImageMetadata) {
  if (!image) return undefined;
  if (image.format === "svg") return image.src;
  const { src } = await getImage({ src: image, width: 480, format: "webp" });
  return src;
}

export function projectEntries(projects: Project[]): Promise<Entry[]> {
  return Promise.all(
    projects.map(async (project) => ({
      href: `/projects/${slugOf(project.id)}`,
      title: project.data.title,
      description: project.data.description,
      year: project.data.publishDate.getUTCFullYear(),
      thumb: await thumb(project.data.thumbnail),
    })),
  );
}

export function noteEntries(notes: Note[]): Entry[] {
  return notes.map((note) => ({
    href: `/notes/${slugOf(note.id)}`,
    title: note.data.title,
    description: note.data.description,
    year: note.data.publishDate.getUTCFullYear(),
    badge: note.data.draft ? "draft" : undefined,
  }));
}
