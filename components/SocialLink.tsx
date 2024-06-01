import { IconType } from "react-icons";

export default function SocialLink({
  Icon,
  href,
}: {
  Icon: IconType;
  href: string;
}) {
  return (
    <a href={href} className="group">
      <Icon
        size={"1.5em"}
        className={
          "text-slate-500 group-hover:text-slate-900 group-focus:text-slate-900 group-active:text-slate-900"
        }
      />
    </a>
  );
}
