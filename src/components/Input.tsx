export default function Input({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  id?: string;
}) {
  return (
    <input
      id={id}
      value={value}
      type="text"
      className="ui-input"
      onChange={onChange}
      placeholder={placeholder}
    />
  );
}
