"use client";

import { useId } from "react";

type Props = {
  value?: string;
  onChange: (value: string) => void;
};

// 1. Extracted array outside the component to prevent re-creation on every render
const COUNTRIES = [
  "All",
  "Pakistan",
  "Japan",
  "USA",
  "Indonesia",
  "Turkey",
  "Chile",
] as const; // Using 'as const' for literal type safety if needed down the line

export default function CountryFilter({ value = "All", onChange }: Props) {
  // 2. Generated a unique ID for accessibility (a11y)
  const selectId = useId();

  return (
    <div className="flex flex-col gap-1.5">
      {/* 3. Added a visually hidden label for screen readers */}
      <label htmlFor={selectId} className="sr-only">
        Filter earthquakes by country
      </label>
      
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[#1a1a2e] border border-white/20 px-3 py-2 rounded-md text-sm outline-none text-white focus:border-orange-500 transition-colors cursor-pointer appearance-none"
      >
        {COUNTRIES.map((country) => (
          <option key={country} value={country} className="bg-[#0f0f22] text-white">
            {country}
          </option>
        ))}
      </select>
    </div>
  );
}