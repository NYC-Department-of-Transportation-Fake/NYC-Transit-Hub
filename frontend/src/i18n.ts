import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import zh from "./locales/zh.json";

const savedLanguage = localStorage.getItem("language");

void i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en,
    },
    zh: {
      translation: zh,
    },
  },
  lng: savedLanguage === "zh" ? "zh" : "en",
  fallbackLng: "en",
  supportedLngs: ["en", "zh"],
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (language) => {
  localStorage.setItem("language", language);
  document.documentElement.lang = language;
});

document.documentElement.lang = i18n.language;

export default i18n;