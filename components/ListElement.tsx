import { IconType } from "react-icons";

export default function ListElement({
  Icon,
  text,
}: {
  Icon: IconType;
  text: string;
}) {
  return (
    <li className="flex pb-4">
      <Icon className="mr-4" size={"1.5em"} />
      {text}
    </li>
  );
}
