"use client";

import { type IProject } from "@/projects";
import ProjectFilterButton from "@/components/ProjectFilterButton";
import Project from "@/components/Project";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

export default function Projects({ projects }: { projects: IProject[] }) {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "highlights";

  const filteredProjects = projects.filter((project) =>
    project.categories.includes(category)
  );

  return (
    <div className="py-4">
      <div className="flex mb-4 flex-wrap">
        <ProjectFilterButton category="highlights" />
        <ProjectFilterButton category="all" />
        <ProjectFilterButton category="robots" />
        <ProjectFilterButton category="electronics" />
        <ProjectFilterButton category="software" />
        <ProjectFilterButton category="maker" />
        <ProjectFilterButton category="glass" />
      </div>
      <motion.div
        layout
        className="grid sm:grid-cols-[minmax(0,_380px)_minmax(0,_380px)] grid-rows-[auto] gap-4 pr-4"
      >
        {filteredProjects.map((project) => (
          <Project
            key={project.title}
            title={project.title}
            description={project.description}
            href={`/projects/${project.slug}`}
            thumbnail={project.thumbnail}
          />
        ))}
      </motion.div>
    </div>
  );
}
