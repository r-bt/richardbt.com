import { IProject } from "@/projects";
import Image from "next/image";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import CommentBox from "./CommentBox";

export default function ProjectLayout({
  metadata,
  children,
}: {
  metadata: IProject;
  children: React.ReactNode;
}) {
  return (
    <div className="px-8">
      <div className="py-8">
        <Link
          href="/"
          className="flex items-center text-slate-400 font-light hover:text-slate-500 focus:text-slate-600 active:text-slate-700 transition-colors"
        >
          <FaArrowLeft className="inline-block mr-2" /> Back to home
        </Link>
      </div>
      <header className="lg:flex lg:px-32">
        <div className="lg:flex-1 lg:flex lg:justify-center lg:flex-col lg:pr-4">
          <h1 className="text-3xl font-bold uppercase pb-4">
            {metadata.title}
          </h1>
          <h2 className="text-lg text-slate-500 pb-4">
            {metadata.description}
          </h2>
        </div>
        <div className="lg:flex-1">
          <Image
            src={metadata.thumbnail}
            alt={metadata.title}
            className="max-h-96 object-contain"
            priority
          />
        </div>
      </header>
      <main className="py-8 max-w-3xl mx-auto">{children}</main>
      <CommentBox />
    </div>
  );
}
