"use client";
import { useRef, useState } from "react";
import { createMaze } from "./maze";
import { drawMaze } from "./draw_maze";
import letters from "./letters";
import Button from "./Button";

export default function MazeGenerator() {
  const mazeContainer = useRef<HTMLDivElement>(null);

  const [mazeText, setMazeText] = useState<string>("");
  const [generated, setGenerated] = useState<boolean>(false);
  const [hrefs, setHrefs] = useState<{
    solved: string;
    unsolved: string;
  }>({ solved: "", unsolved: "" });
  const [mazeAttributes, setMazeAttributes] = useState<{
    width: number;
    height: number;
  }>({ width: 65, height: 25 });
  const [errorChars, setErrorChars] = useState<string[]>([]);

  const generate = () => {
    setGenerated(true);

    const { passages, letterPoints, extraPathPoints, width, height } =
      createMaze(mazeAttributes.width, mazeAttributes.height, mazeText, true);

    // Generated the SVGs
    const solvedSvg = drawMaze(
      passages,
      width,
      height,
      letterPoints,
      extraPathPoints
    );

    const unsolvedSvg = drawMaze(passages, width, height, [], []);

    // Display the maze

    mazeContainer.current!.innerHTML = "";

    solvedSvg.addTo(mazeContainer.current!).size("100%", "100%");

    // Create the download links
    const solvedHref = URL.createObjectURL(
      new Blob([solvedSvg.svg()], { type: "image/svg+xml" })
    );

    const unsolvedHref = URL.createObjectURL(
      new Blob([unsolvedSvg.svg()], { type: "image/svg+xml" })
    );

    setHrefs({ solved: solvedHref, unsolved: unsolvedHref });
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMazeText(e.target.value);

    const newErrorChars: Set<string> = new Set();

    e.target.value.split("").forEach((char) => {
      if (letters[char] === undefined) {
        newErrorChars.add(char);
      }
    });

    setErrorChars(Array.from(newErrorChars));
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMazeAttributes({ ...mazeAttributes, width: parseInt(e.target.value) });
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMazeAttributes({ ...mazeAttributes, height: parseInt(e.target.value) });
  };

  return (
    <div className="w-full">
      <div>
        <div className="flex">
          <input
            value={mazeText}
            type="text"
            className="bg -gray-50 border border-r-0 border-gray-300 hover:border-gray-400 rounded-l-md block w-full p-2.5 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
            onChange={handleInput}
            placeholder="Enter a message"
          />
          <button
            onClick={generate}
            className="bg-violet-500 text-white px-4 py-2 rounded-r-md hover:bg-violet-600 focus:bg-violet-600 active:bg-violet-700 transition duration-150 ease-in-out"
          >
            {generated ? "Update" : "Generate"}
          </button>
        </div>
        <div className="min-h-10">
          {errorChars.length > 0 && (
            <div className="pt-2 text-red-500">
              The following characters are not supported:{" "}
              {errorChars.join(", ")}
            </div>
          )}
        </div>
        <div className="pt-2 flex flex-wrap">
          <div className="mr-4 mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Min Width:
            </label>
            <input
              value={mazeAttributes.width}
              onChange={handleWidthChange}
              type="number"
              className="bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-md block p-2.5 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Min Height:
            </label>
            <input
              value={mazeAttributes.height}
              onChange={handleHeightChange}
              type="number"
              className="bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-md block p-2.5 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
            />
          </div>
        </div>
      </div>
      <div ref={mazeContainer} className="pt-4"></div>
      {generated && (
        <div className="pt-4 flex justify-between items-center flex-wrap">
          <div>
            <Button href={hrefs.solved} fileName={"solved_maze.svg"}>
              Download Solved
            </Button>
            <Button href={hrefs.unsolved} fileName={"unsolved_maze.svg"}>
              Download Unsolved
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
