import { StaticImageData } from "next/image";
import Image from "next-export-optimize-images/image";

export default function ProjectImage({
  src,
  alt,
}: {
  src: StaticImageData;
  alt: string;
}) {
  return (
    <div className="text-center py-4 flex flex-col items-center h-full justify-between">
      <Image src={src} alt={alt} className="max-h-96 object-contain" />
      <span className="text-sm text-slate-500">{alt}</span>
    </div>
  );
}
