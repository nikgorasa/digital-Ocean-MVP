"use client";

import { useState, useCallback, useEffect } from "react";
import { Language, getTranslations, detectLanguage } from "@/lib/ai/i18n/translations";

interface UseLanguageReturn {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: ReturnType<typeof getTranslations>;
  detectAndSet: (text: string) => void;
}

export function useLanguage(initial: Language = "en"): UseLanguageReturn {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("gorasa_lang") as Language) || initial;
    }
    return initial;
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("gorasa_lang", lang);
  }, []);

  const detectAndSet = useCallback(
    (text: string) => {
      const detected = detectLanguage(text);
      if (detected !== language) {
        setLanguage(detected);
      }
    },
    [language, setLanguage]
  );

  const t = getTranslations(language);

  return { language, setLanguage, t, detectAndSet };
}
