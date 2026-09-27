import { useEffect, useRef, useState } from "react";
import { createMaze } from "./maze";
import { drawMaze } from "./draw_maze";
import letters from "./letters";
import Button from "./Button";

const DEFAULT_MESSAGE = "Hello";

export default function MazeGenerator() {
  const mazeContainer = useRef<HTMLDivElement>(null);

  const [mazeText, setMazeText] = useState<string>(DEFAULT_MESSAGE);
  const [generated, setGenerated] = useState<boolean>(false);
  const [showSolution, setShowSolution] = useState<boolean>(true);
  const [svgs, setSvgs] = useState<{ solved: string; unsolved: string }>();
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
    if (errorChars.length > 0 || mazeText.trim() === "") return;

    const { passages, letterPoints, extraPathPoints, width, height } =
      createMaze(mazeAttributes.width, mazeAttributes.height, mazeText, true);

    const solvedSvg = drawMaze(passages, width, height, letterPoints, extraPathPoints);
    const unsolvedSvg = drawMaze(passages, width, height, [], []);

    setSvgs({ solved: solvedSvg.svg(), unsolved: unsolvedSvg.svg() });

    // Download links
    if (hrefs.solved) URL.revokeObjectURL(hrefs.solved);
    if (hrefs.unsolved) URL.revokeObjectURL(hrefs.unsolved);

    setHrefs({
      solved: URL.createObjectURL(
        new Blob([solvedSvg.svg()], { type: "image/svg+xml" })
      ),
      unsolved: URL.createObjectURL(
        new Blob([unsolvedSvg.svg()], { type: "image/svg+xml" })
      ),
    });
    setGenerated(true);
  };

  // Show an example straight away rather than an empty box.
  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!svgs || !mazeContainer.current) return;
    mazeContainer.current.innerHTML = showSolution ? svgs.solved : svgs.unsolved;
    const svg = mazeContainer.current.querySelector("svg");
    svg?.setAttribute("width", "100%");
    svg?.setAttribute("height", "100%");
  }, [svgs, showSolution]);

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
    <div className="panel p-4 sm:p-5">
      <form
        className="grid gap-3 sm:grid-cols-[1fr_6rem_6rem_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          generate();
        }}
      >
        <div>
          <label className="ui-label" htmlFor="maze-message">
            Message
          </label>
          <input
            id="maze-message"
            value={mazeText}
            type="text"
            className="ui-input"
            onChange={handleInput}
            placeholder="Enter a message"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="ui-label" htmlFor="maze-width">
            Min width
          </label>
          <input
            id="maze-width"
            value={mazeAttributes.width}
            onChange={handleWidthChange}
            type="number"
            min={10}
            className="ui-input"
          />
        </div>
        <div>
          <label className="ui-label" htmlFor="maze-height">
            Min height
          </label>
          <input
            id="maze-height"
            value={mazeAttributes.height}
            onChange={handleHeightChange}
            type="number"
            min={10}
            className="ui-input"
          />
        </div>
        <button
          type="submit"
          className="ui-button ui-button--primary"
          disabled={errorChars.length > 0 || mazeText.trim() === ""}
        >
          {generated ? "Regenerate" : "Generate"}
        </button>
      </form>

      <div className="min-h-6 pt-2" aria-live="polite">
        {errorChars.length > 0 && (
          <p className="ui-error">
            Not supported: {errorChars.map((c) => (c === " " ? "space" : c)).join(" ")}
          </p>
        )}
      </div>

      <div
        ref={mazeContainer}
        className="mt-2 rounded-[3px] border border-rule bg-paper p-2 sm:p-3"
        role="img"
        aria-label={`A maze whose solution spells "${mazeText}"`}
      ></div>

      {generated && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <label className="ui-hint flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="accent-[var(--accent)]"
              checked={showSolution}
              onChange={(e) => setShowSolution(e.target.checked)}
            />
            Show solution
          </label>
          <div className="flex flex-wrap gap-2">
            <Button href={hrefs.unsolved} fileName={"maze.svg"}>
              Download maze
            </Button>
            <Button href={hrefs.solved} fileName={"maze_solution.svg"}>
              Download solution
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
