import Image from "next/image";
import bio from "@/public/bio.jpg";
import ListElement from "@/components/ListElement";
import { IoHomeSharp, IoLocationSharp } from "react-icons/io5";
import { MdConstruction, MdEmail } from "react-icons/md";
import NavigationLink from "./NavigationLink";
import { SiGithub, SiLinkedin } from "react-icons/si";
import SocialLink from "./SocialLink";

export default function SideBar() {
  return (
    <section className="flex flex-col justify-center h-full w-fit lg:right-0 lg:pl-2 lg:pr-6 lg:ml-auto">
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
          <span className="font-light">Building with software / hardware</span>
        </div>
      </div>
      <div className="pt-6">
        <ul>
          <ListElement Icon={MdConstruction} text="Text Maze Generator" />
          <ListElement Icon={IoLocationSharp} text="MIT, Cambridge" />
          <ListElement Icon={IoHomeSharp} text="Dublin, Ireland" />
        </ul>
      </div>
      <div className="flex mb-4 justify-around">
        <SocialLink href="mailto:richard.beattie91@gmail.com" Icon={MdEmail} />
        <SocialLink href="https://github.com/r-bt" Icon={SiGithub} />
        <SocialLink
          href="https://www.linkedin.com/in/richard--beattie/"
          Icon={SiLinkedin}
        />
      </div>
      <div>
        <ul className="lg:text-right leading-8 text-md">
          <NavigationLink href="/">projects</NavigationLink>
          <li className="inline lg:block pr-4 lg:pr-0">
            <a
              href="/resume.pdf"
              className={
                "text-slate-300 hover:text-slate-400 focus:text-slate-500"
              }
            >
              resume
            </a>
          </li>
          <NavigationLink href="/classes">classes</NavigationLink>
          <NavigationLink href="/ideas">ideas</NavigationLink>
        </ul>
      </div>
      <hr className="lg:none" />
    </section>
  );
}
