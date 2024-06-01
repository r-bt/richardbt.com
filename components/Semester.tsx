export default function Semester({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-4">
      <h1 className="text-lg">{title}</h1>
      <div className="flex gap-3 flex-wrap pr-2">{children}</div>
    </div>
  );
}
