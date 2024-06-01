const course_colors: { [key: string]: string } = {
  "6": "bg-[#4390DE]",
  CMS: "bg-[#57B58C]",
  "21M": "bg-[#57ACB5]",
  "18": "bg-[#575DB5]",
  "2": "bg-[#DE7643]",
  "17": "bg-[#DE43B7]",
  "24": "bg-[#7657B5]",
  ES: "bg-[#5A57B5]",
  "9": "bg-[#8143DE]",
};

export default function Class({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  const course_number = number.split(".")[0];

  const color = course_colors[course_number] || "bg-gray-500";

  return (
    <div className={`${color} px-3 py-2 lg:px-6 lg:py-4`}>
      <h2 className="text-white text-sm lg:text-md">{number}</h2>
      <span className="text-white text-xs font-light">{title}</span>
    </div>
  );
}
