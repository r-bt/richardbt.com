export default function Input({
  value,
  onChange,
  placeholder,
  id,
  autoCapitalize,
}: {
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  id?: string;
  autoCapitalize?: string;
}) {
  return (
    <input
      id={id}
      value={value}
      type="text"
      className="ui-input"
      onChange={onChange}
      placeholder={placeholder}
      autoCapitalize={autoCapitalize}
      autoComplete="off"
      spellCheck={false}
    />
  );
}
