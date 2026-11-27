import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => void i18n.changeLanguage("en")}
        aria-pressed={i18n.language === "en"}
        className={`rounded px-3 py-1 ${
          i18n.language === "en"
            ? "bg-slate-900 text-white"
            : "bg-slate-100 text-slate-700"
        }`}
      >
        {t("language.english")}
      </button>

      <button
        type="button"
        onClick={() => void i18n.changeLanguage("zh")}
        aria-pressed={i18n.language === "zh"}
        className={`rounded px-3 py-1 ${
          i18n.language === "zh"
            ? "bg-slate-900 text-white"
            : "bg-slate-100 text-slate-700"
        }`}
      >
        {t("language.chinese")}
      </button>
    </div>
  );
}