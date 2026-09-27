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
    <a className="ui-button" href={href} download={fileName}>
      {children}
    </a>
  );
}
