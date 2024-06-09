export default function Button({
  fileName,
  children,
  href,
}: {
  fileName: string;
  children: React.ReactNode;
  href: string;
}): JSX.Element {
  return (
    <a
      className="bg-violet-500 text-white px-4 py-2 rounded-md hover:bg-violet-600 focus:bg-violet-600 active:bg-violet-700 transition duration-150 ease-in-out mr-4"
      href={href}
      download={fileName}
    >
      {children}
    </a>
  );
}
