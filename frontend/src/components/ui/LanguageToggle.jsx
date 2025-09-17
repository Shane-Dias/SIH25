import { useState } from "react";

export default function LanguageToggle() {
  const [lang, setLang] = useState("en");

  const changeLanguage = (language) => {
    const select = document.querySelector(".goog-te-combo");
    if (select) {
      select.value = language;
      select.dispatchEvent(new Event("change"));
      setLang(language);
    }
  };

  return (
    <button
      onClick={() => changeLanguage(lang === "en" ? "hi" : "en")}
      className="px-4 py-2 rounded bg-cyan-600 text-white hover:bg-cyan-700 transition"
    >
      {lang === "en" ? "हिन्दी में बदलें" : "Switch to English"}
    </button>
  );
}
