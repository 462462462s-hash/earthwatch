"use client";

type Props = {
  value?: string;
  onChange: (value: string) => void;
};

export default function CountryFilter({ value = "All", onChange }: Props) {
  const countries = [
    "All",
    "Pakistan",
    "Japan",
    "USA",
    "Indonesia",
    "Turkey",
    "Chile",
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white/10 px-3 py-2 rounded-md text-sm outline-none text-white"
    >
      {countries.map((c) => (
        <option key={c} value={c} className="text-black">
          {c}
        </option>
      ))}
    </select>
  );
}