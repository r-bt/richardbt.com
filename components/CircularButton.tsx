import { useState } from "react";

const CircularButton = ({
  onClick,
  text,
}: {
  onClick: () => void;
  text: string;
}) => {
  const [isClicked, setIsClicked] = useState(false);

  return (
    <div className="flex items-center pb-2">
      <button
        className="relative w-5 h-5 rounded-full border-2 border-slate-400 focus:outline-none flex justify-center items-center transition-colors hover:border-slate-500 active:border-slate-600"
        onMouseDown={() => setIsClicked(true)}
        onMouseUp={() => setIsClicked(false)}
        onMouseLeave={() => setIsClicked(false)}
        aria-label={text}
        onClick={onClick}
      >
        {isClicked && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
      </button>
      <span className="pl-2">{text}</span>
    </div>
  );
};

export default CircularButton;
