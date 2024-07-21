"use client";

import Image from "next/image";
import { StaticImageData } from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Project({
  thumbnail,
  href,
  title,
  description,
}: {
  title: string;
  description: string;
  href: string;
  thumbnail: StaticImageData;
}) {
  return (
    <motion.div layout className="relative h-52">
      <Link
        href={href}
        className="h-full flex flex-col justify-end group relative overflow-hidden"
        passHref
      >
        <Image
          src={thumbnail}
          alt={title}
          style={{
            objectFit: "cover",
          }}
          fill
          className="-z-10 group-hover:blur-[7px] group-focus:blur-[3px] group-active:blur-[3px] transition ease-in-out duration-200"
        />
        <p className="text-white uppercase font-bold text-lg ml-4 mb-2 block relative transition ease-in-out duration-200 group-hover:-translate-y-4 translate-y-8">
          {title}
        </p>
        <p
          className={
            "text-white ml-4 text-md font-light opacity-0 transition ease-in-out duration-200 group-hover:opacity-100 group-hover:-translate-y-4 translate-y-8"
          }
        >
          {description}
        </p>
      </Link>
    </motion.div>
  );
}
