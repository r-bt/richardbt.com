import SideBar from "@/components/SideBar";
import Projects from "@/components/Projects";
import { getProjects } from "@/projects";
import { Suspense } from "react";

export default async function Home() {
  const projects = await getProjects();

  return (
    <Suspense>
      <Projects projects={projects} />
    </Suspense>
  );
}
