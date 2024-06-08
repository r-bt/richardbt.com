"use client";
import { useRef, useState } from "react";
import { createMaze } from "./maze";
import { drawMaze } from "./draw_maze";

export default function MazeGenerator() {
  const mazeContainer = useRef<HTMLDivElement>(null);
  const [mazeText, setMazeText] = useState<string>("");

  const generate = () => {
    const { passages, letterPoints, extraPathPoints, width, height } =
      createMaze(65, 25, mazeText, true);

    drawMaze(
      passages,
      width,
      height,
      mazeContainer.current!,
      letterPoints,
      extraPathPoints
    );
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMazeText(e.target.value);
  };

  return (
    <div className="w-full">
      <div className="flex">
        <input
          type="text"
          className="bg -gray-50 border border-r-0 border-gray-300 hover:border-gray-400 rounded-l-md block w-full p-2.5 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
          onChange={handleInput}
        />
        <button
          onClick={generate}
          className="bg-violet-500 text-white px-4 py-2 rounded-r-md hover:bg-violet-600 focus:bg-violet-600 active:bg-violet-700 transition duration-150 ease-in-out"
        >
          Generate
        </button>
      </div>
      <div ref={mazeContainer}></div>
    </div>
  );
}
