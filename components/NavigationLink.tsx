"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavigationLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = pathname === href;

  return (
    <li className="inline lg:block pr-4 lg:pr-0">
      <Link
        href={href}
        className={`${
          isActive
            ? "text-slate-900"
            : "text-slate-300 hover:text-slate-400 focus:text-slate-500"
        }`}
      >
        {children}
      </Link>
    </li>
  );
}
