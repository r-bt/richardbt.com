import MazeGenerator from "./MazeGenerator";
import Logo from "./Logo";

export default function Maze() {
  return (
    <main className="flex justify-center min-h-dvh items-center">
      <div className="lg:w-1/2 py-2 px-2">
        <div className="pb-6">
          <Logo />
        </div>
        <MazeGenerator />
      </div>
    </main>
  );
}
