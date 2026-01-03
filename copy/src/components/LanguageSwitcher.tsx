import clsx from "clsx";
import React from "react";
import { useTranslation } from "react-i18next";
import { useThemeContext } from "../contexts/ThemeContext";

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const { mode } = useThemeContext();

  const change = (lng: string) => {
    i18n.changeLanguage(lng);
    document.documentElement.lang = lng;
    document.documentElement.dir = lng === "en" ? "ltr" : "rtl";
  };

  const getLanguageDisplay = (lang: string) => {
    switch (lang) {
      case "en":
        return "English";
      case "fa-AF":
        return "دری (Dari)";
      case "ps-AF":
        return "پښتو (Pashto)";
      default:
        return "English";
    }
  };

  return (
    <div className="relative" title="Select Language">
      <button
        value={i18n.resolvedLanguage}
        className={clsx(
          "flex items-center gap-2 border rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 hover:shadow-md",
          mode === "dark"
            ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:border-slate-600"
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:border-gray-400"
        )}
      >
        {/* Globe Icon */}
        <svg
          className={clsx(
            "w-4 h-4 text-gray-600",
            mode === "dark" ? "text-gray-400" : "text-gray-600"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{getLanguageDisplay(i18n.resolvedLanguage)}</span>
        {/* Chevron Down Icon */}
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      <select
        value={i18n.resolvedLanguage}
        onChange={(e) => change(e.target.value)}
        className={clsx(
          "absolute inset-0 w-full h-full opacity-0 cursor-pointer",
          mode === "dark"
            ? "border-slate-700 bg-slate-800 text-slate-300"
            : "border-slate-200 bg-white text-slate-600"
        )}
      >
        <option value="en">English</option>
        <option value="fa-AF">Dari</option>
        <option value="ps-AF">Pashto</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;
