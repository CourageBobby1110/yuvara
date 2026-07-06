"use client";

import { useLanguage } from "@/context/LanguageContext";

interface LanguageSwitcherProps {
  variant?: "dropdown" | "flowing";
}

export default function LanguageSwitcher({ variant = "dropdown" }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  const isFlowing = variant === "flowing";

  if (isFlowing) {
    return (
      <div className="flex items-center justify-between w-full py-1.5">
        <span className="text-sm font-bold text-gray-900">Language</span>
        <div className="flex items-center gap-1.5">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="text-sm font-bold text-[#996515] bg-transparent outline-none border-none cursor-pointer text-right pr-4"
            style={{
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23996515' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right center",
              backgroundSize: "10px",
            }}
          >
            <option value="en">English (EN)</option>
            <option value="es">Español (ES)</option>
            <option value="fr">Français (FR)</option>
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left">
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as any)}
        className="block w-full rounded-md border-gray-300 py-1.5 text-base leading-5 font-medium text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm bg-transparent"
        style={{ cursor: "pointer" }}
      >
        <option value="en">🇺🇸 EN</option>
        <option value="es">🇪🇸 ES</option>
        <option value="fr">🇫🇷 FR</option>
      </select>
    </div>
  );
}
