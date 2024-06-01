import { readdir } from "fs/promises";
import { StaticImageData } from "next/image";

export interface IProject {
  slug: string;
  title: string;
  publishDate: string;
  thumbnail: StaticImageData;
  description: string;
  categories: string[];
}

export async function getProjects(): Promise<IProject[]> {
  const slugs = (
    await readdir("./app/(projects)/projects", { withFileTypes: true })
  ).filter((dirent) => dirent.isDirectory());

  const projects = await Promise.all(
    slugs.map(async (dirent) => {
      const { metadata } = await import(
        `./app/(projects)/projects/${dirent.name}/page.mdx`
      );
      return {
        slug: dirent.name,
        ...metadata,
      };
    })
  );

  projects.sort(
    (a, b) =>
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
  );

  return projects;
}
