import Image, { StaticImageData } from "next/image";
import Link from "next/link";

export default function Project({
  thumbnail,
  href,
  alt,
  title,
}: {
  title: string;
  href: string;
  alt: string;
  thumbnail: StaticImageData;
}) {
  return (
    <div className="relative h-52">
      <Link href={href} className="h-full flex flex-col justify-end">
        <Image
          src={thumbnail}
          alt={alt}
          objectFit="cover"
          fill
          className="-z-10"
        />
        <p className="text-white uppercase font-bold text-lg ml-4 mb-4 block">
          {title}
        </p>
      </Link>
    </div>
  );
}
