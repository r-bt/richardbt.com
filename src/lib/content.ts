import { getCollection, type CollectionEntry } from "astro:content";

export type Project = CollectionEntry<"projects">;
export type Note = CollectionEntry<"notes">;
export type Build = CollectionEntry<"builds">;

/** `connect-4/index` → `connect-4` */
export function slugOf(id: string): string {
  return id.replace(/\/index$/, "");
}

const byNewest = <T extends { data: { publishDate: Date } }>(a: T, b: T) =>
  b.data.publishDate.getTime() - a.data.publishDate.getTime();

export async function getProjects(): Promise<Project[]> {
  return (await getCollection("projects")).sort(byNewest);
}

/** The build write-up for a project, if it has one. */
export async function getBuild(projectSlug: string): Promise<Build | undefined> {
  const builds = await getCollection("builds");
  return builds.find((build) => slugOf(build.id).replace(/\/build$/, "") === projectSlug);
}

export async function getBuilds(): Promise<Build[]> {
  return getCollection("builds");
}

export async function getNotes(): Promise<Note[]> {
  const notes = await getCollection("notes", ({ data }) =>
    import.meta.env.PROD ? !data.draft : true,
  );
  return notes.sort(byNewest);
}

// Categories that are bookkeeping from the old filterable grid, not topics.
const HIDDEN_CATEGORIES = new Set(["all", "highlights"]);

export function topicsOf(project: Project): string[] {
  return project.data.categories.filter((c) => !HIDDEN_CATEGORIES.has(c));
}

export function isHighlight(project: Project): boolean {
  return project.data.categories.includes("highlights");
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
