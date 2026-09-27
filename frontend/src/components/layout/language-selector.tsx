"use client";

import { useEffect, useId, useRef, useState } from "react";

import {
  BrazilFlag,
  UnitedStatesFlag,
  WorldIcon,
} from "@/components/layout/language-icons";
import {
  useLanguage,
  type Locale,
  type TranslationKey,
} from "@/i18n/language-provider";

const languageOptions: Array<{
  locale: Locale;
  labelKey: TranslationKey;
  Flag: typeof BrazilFlag;
}> = [
  { locale: "pt-BR", labelKey: "language.portuguese", Flag: BrazilFlag },
  { locale: "en", labelKey: "language.english", Flag: UnitedStatesFlag },
];

export function LanguageSelector() {
  const { locale, setLocale, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function selectLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={t("language.label")}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        title={t("language.label")}
        onClick={() => setIsOpen((current) => !current)}
        className="grid size-11 place-items-center rounded-xl border border-white/15 text-zinc-300 transition hover:border-emerald-300/50 hover:bg-emerald-300/[0.06] hover:text-emerald-200 focus-visible:border-emerald-300/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/15"
      >
        <WorldIcon />
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label={t("language.label")}
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-emerald-300/20 bg-zinc-950/95 p-2 text-zinc-100 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
        >
          <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
            {t("language.label")}
          </p>
          {languageOptions.map(({ locale: optionLocale, labelKey, Flag }) => {
            const isSelected = locale === optionLocale;

            return (
              <button
                key={optionLocale}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={() => selectLocale(optionLocale)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  isSelected
                    ? "bg-emerald-300/12 text-emerald-100"
                    : "text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <span className="grid h-7 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] shadow-inner">
                  <Flag className="h-4 w-6 rounded-[2px] shadow-sm" />
                </span>
                <span className="flex-1 font-medium">{t(labelKey)}</span>
                {isSelected && (
                  <svg viewBox="0 0 20 20" className="size-4 text-emerald-300" fill="none" aria-hidden="true">
                    <path d="m4 10 3.5 3.5L16 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
