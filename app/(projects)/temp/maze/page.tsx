import MazeGenerator from "./MazeGenerator";

export default function Maze() {
  return (
    <main className="flex justify-center h-dvh items-center">
      <div className="w-1/2">
        <MazeGenerator />
      </div>
    </main>
  );
}
