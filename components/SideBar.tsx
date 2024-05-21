import Image from "next/image";
import bio from "@/public/bio.jpg";
import ListElement from "@/components/ListElement";
import { IoHomeSharp, IoLocationSharp } from "react-icons/io5";
import { MdConstruction } from "react-icons/md";

export default function SideBar() {
  return (
    <section className="flex flex-col justify-center h-full w-fit lg:right-0 pl-2 lg:pr-6 lg:ml-auto">
      <div className="flex">
        <div className="basis-1/4 max-w-80">
          <Image
            src={bio}
            alt="Richard"
            className="rounded-full"
            width={120}
            height={120}
          />
        </div>
        <div className="pl-6 flex flex-col justify-center">
          <span className="font-bold text-2xl lg:leading-4 lg:pb-6 mt-2">
            RICHARD BEATTIE
          </span>
          <span className="font-light">EECS @ MIT, Class of 2025</span>
          <span className="font-light hidden sm:block">
            Building with software / hardware
          </span>
        </div>
      </div>
      <div className="pt-6">
        <ul>
          <ListElement Icon={MdConstruction} text="Connect-4 Robot" />
          <ListElement Icon={IoLocationSharp} text="MIT, Cambridge" />
          <ListElement Icon={IoHomeSharp} text="Dublin, Ireland" />
        </ul>
      </div>
    </section>
  );
}
