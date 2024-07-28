export default function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      type="text"
      className="bg -gray-50 border border-gray-300 hover:border-gray-400 rounded-md block w-full p-2.5 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
      onChange={onChange}
      placeholder={placeholder}
    />
  );
}
