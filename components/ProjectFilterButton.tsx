"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

const Button = ({ category }: { category: string }) => {
  const searchParams = useSearchParams();

  const search = searchParams.get("category") || "highlights";

  let active =
    search === category
      ? "text-slate-900"
      : "text-slate-300 hover:text-slate-400 focus:text-slate-500";

  return (
    <Link
      className={`mr-4  ${active}`}
      href={{
        pathname: "/",
        query: { category },
      }}
    >
      {category}
    </Link>
  );
};

export default function ProjectFilterButton({
  category,
}: {
  category: string;
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Button category={category} />
    </Suspense>
  );
}
