import { useEffect, useMemo, useRef, useState } from "react";
import { createMaze } from "./maze";
import { drawMaze } from "./draw_maze";
import letters from "./letters";
import Button from "./Button";

const DEFAULT_MESSAGE = "Hello";
const MIN_SIZE = 10;
const MAX_SIZE = 200;

/** A size field's value, or null while it's empty or out of range. */
const parseSize = (value: string) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= MIN_SIZE && n <= MAX_SIZE ? n : null;
};

export default function MazeGenerator() {
  const mazeContainer = useRef<HTMLDivElement>(null);

  const [mazeText, setMazeText] = useState<string>(DEFAULT_MESSAGE);
  const [widthInput, setWidthInput] = useState("65");
  const [heightInput, setHeightInput] = useState("25");
  const [showSolution, setShowSolution] = useState<boolean>(true);
  const [svgs, setSvgs] = useState<{ solved: string; unsolved: string }>();

  const width = parseSize(widthInput);
  const height = parseSize(heightInput);

  // Characters without a maze letter are skipped rather than blocking.
  const skipped = useMemo(
    () => [...new Set(Array.from(mazeText).filter((c) => letters[c] === undefined))],
    [mazeText]
  );

  // Rebuild shortly after the message or size changes.
  useEffect(() => {
    if (width === null || height === null) return;

    const timer = setTimeout(() => {
      const { passages, letterPoints, extraPathPoints, width: w, height: h } = createMaze(
        width,
        height,
        mazeText,
        true
      );
      setSvgs({
        solved: drawMaze(passages, w, h, letterPoints, extraPathPoints),
        unsolved: drawMaze(passages, w, h, [], []),
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [mazeText, width, height]);

  useEffect(() => {
    if (!svgs || !mazeContainer.current) return;
    mazeContainer.current.innerHTML = showSolution ? svgs.solved : svgs.unsolved;
    const svg = mazeContainer.current.querySelector("svg");
    svg?.setAttribute("width", "100%");
    svg?.removeAttribute("height");
  }, [svgs, showSolution]);

  const hrefs = useMemo(() => {
    if (!svgs) return undefined;
    return {
      solved: URL.createObjectURL(new Blob([svgs.solved], { type: "image/svg+xml" })),
      unsolved: URL.createObjectURL(new Blob([svgs.unsolved], { type: "image/svg+xml" })),
    };
  }, [svgs]);

  useEffect(
    () => () => {
      if (hrefs) {
        URL.revokeObjectURL(hrefs.solved);
        URL.revokeObjectURL(hrefs.unsolved);
      }
    },
    [hrefs]
  );

  return (
    <div className="panel p-4 sm:p-5">
      <form
        className="grid gap-3 sm:grid-cols-[1fr_6rem_6rem] sm:items-end"
        onSubmit={(e) => e.preventDefault()}
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
            onChange={(e) => setMazeText(e.target.value)}
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
            value={widthInput}
            onChange={(e) => setWidthInput(e.target.value)}
            type="number"
            min={MIN_SIZE}
            max={MAX_SIZE}
            className="ui-input"
            aria-invalid={width === null}
          />
        </div>
        <div>
          <label className="ui-label" htmlFor="maze-height">
            Min height
          </label>
          <input
            id="maze-height"
            value={heightInput}
            onChange={(e) => setHeightInput(e.target.value)}
            type="number"
            min={MIN_SIZE}
            max={MAX_SIZE}
            className="ui-input"
            aria-invalid={height === null}
          />
        </div>
      </form>

      <div className="min-h-6 pt-2" aria-live="polite">
        {(width === null || height === null) && (
          <p className="ui-hint">
            Width and height go from {MIN_SIZE} to {MAX_SIZE}.
          </p>
        )}
        {skipped.length > 0 && (
          <p className="ui-hint">
            Skipping {skipped.map((c) => (c === "\n" ? "new line" : c)).join(" ")}
          </p>
        )}
      </div>

      <div
        ref={mazeContainer}
        className="mt-2 rounded-[3px] border border-rule bg-paper p-2 sm:p-3"
        role="img"
        aria-label={`A maze whose solution spells "${mazeText}"`}
      ></div>

      {hrefs && (
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
