import Image from "next/image";
import Project from "@/components/Project";
import pirateThumbnail from "@/public/projects/pirate-ship/thumbnail.jpg";
import SideBar from "@/components/SideBar";
import YouTube from "react-youtube";

export default function Home() {
  return (
    <div className="flex h-screen flex-col lg:flex-row p-4 lg:p-0 lg:overflow-hidden">
      <div className="lg:basis-1/3 lg:relative">
        <SideBar />
      </div>
      <div className="lg:basis-2/3 lg:overflow-auto">
        <h1 className="text-xl text-center mt-12">Work in Progress</h1>
        <h2 className="text-l text-center mt-6">
          For now here is my Connect-4 Playing Robot
        </h2>
        <div className="flex justify-around">
          <iframe
            width="560"
            height="315"
            src="https://www.youtube-nocookie.com/embed/X0XXUfkOlMY?si=TvuaJ6pMsfrg_ywx"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          ></iframe>
        </div>

        {/* <div>
          <div className="flex">
            <ul>
              <li>All</li>
              <li>Maker</li>
            </ul>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 grid-rows-[auto] lg:pr-60 gap-4">
            <Project
              thumbnail={pirateThumbnail}
              alt="Pirate Ship"
              title="Pirate Ship"
              href="/projects/pirate-ship"
            />
            <Project
              thumbnail={pirateThumbnail}
              alt="Pirate Ship"
              title="Pirate Ship"
              href="/projects/pirate-ship"
            />
            <Project
              thumbnail={pirateThumbnail}
              alt="Pirate Ship"
              title="Pirate Ship"
              href="/projects/pirate-ship"
            />
            <Project
              thumbnail={pirateThumbnail}
              alt="Pirate Ship"
              title="Pirate Ship"
              href="/projects/pirate-ship"
            />
            <Project
              thumbnail={pirateThumbnail}
              alt="Pirate Ship"
              title="Pirate Ship"
              href="/projects/pirate-ship"
            />
            <Project
              thumbnail={pirateThumbnail}
              alt="Pirate Ship"
              title="Pirate Ship"
              href="/projects/pirate-ship"
            />{" "}
            <Project
              thumbnail={pirateThumbnail}
              alt="Pirate Ship"
              title="Pirate Ship"
              href="/projects/pirate-ship"
            />
          </div>
        </div> */}
      </div>
    </div>
  );
}
