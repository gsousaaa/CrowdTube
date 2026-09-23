"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type SidebarItem = {
  label: string;
  description: string;
  icon: "profile" | "wallet" | "report";
  href?: string;
};

const navigation: SidebarItem[] = [
  {
    label: "Perfil",
    description: "Foto, dados do criador e canal no YouTube",
    icon: "profile",
  },
  {
    label: "Carteira",
    description: "Saldo recebido e saque de doações",
    icon: "wallet",
    href: "/admin/wallet",
  },
  {
    label: "Relatórios",
    description: "Arrecadação geral, por campanha e por período",
    icon: "report",
  },
];

function SidebarIcon({ name }: { name: SidebarItem["icon"] }) {
  if (name === "profile") {
    return (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
        <path
          d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "wallet") {
    return (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
        <path
          d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v12H6.5A2.5 2.5 0 0 1 4 16.5v-9Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M16 11h5v4h-5a2 2 0 1 1 0-4Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
      <path
        d="M5 20V10m7 10V4m7 16v-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M3 20h18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden="true">
      {isOpen ? (
        <path
          d="m6 6 12 12M18 6 6 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M4 7h16M4 12h16M4 17h16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function MobileNavigation({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Área do criador" className="mt-8">
      <ul className="space-y-2">
        {navigation.map((item) => {
          const isActive = item.href === pathname;
          const content = (
            <>
              <span
                className={`grid size-11 shrink-0 place-items-center rounded-xl border transition ${
                  isActive
                    ? "border-emerald-300/50 bg-emerald-300/15 text-emerald-200"
                    : "border-white/10 text-zinc-400"
                }`}
              >
                <SidebarIcon name={item.icon} />
              </span>
              <span className="min-w-0 text-left">
                <span className="block text-sm font-medium text-zinc-100">
                  {item.label}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-zinc-500">
                  {item.description}
                </span>
              </span>
            </>
          );

          return (
            <li key={item.label}>
              {item.href ? (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  className="flex w-full items-center gap-3 rounded-2xl p-2 transition hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60"
                >
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  title={`${item.label} — será implementado em uma próxima etapa`}
                  className="flex w-full cursor-not-allowed items-center gap-3 rounded-2xl p-2 opacity-60"
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function DesktopNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Área do criador" className="mt-8 min-w-0 flex-1">
      <ul className="flex flex-col gap-2">
        {navigation.map((item) => {
          const isActive = item.href === pathname;
          const className = `flex size-12 items-center justify-center rounded-xl border transition focus-visible:outline-none ${
            isActive
              ? "border-emerald-300/50 bg-emerald-300/15 text-emerald-200"
              : "border-white/10 text-zinc-400 hover:border-emerald-300/40 hover:bg-emerald-300/10 hover:text-emerald-200 focus-visible:border-emerald-300/60 focus-visible:text-emerald-200"
          }`;

          return (
            <li key={item.label} className="group relative">
              {item.href ? (
                <Link
                  href={item.href}
                  aria-label={`${item.label}: ${item.description}`}
                  aria-current={isActive ? "page" : undefined}
                  className={className}
                >
                  <SidebarIcon name={item.icon} />
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  aria-label={`${item.label}: ${item.description}`}
                  title={`${item.label} — será implementado em uma próxima etapa`}
                  className={`${className} cursor-not-allowed text-zinc-500`}
                >
                  <SidebarIcon name={item.icon} />
                </button>
              )}

              <div className="pointer-events-none absolute top-1/2 left-full z-10 ml-3 hidden w-56 -translate-y-1/2 rounded-xl border border-white/10 bg-zinc-950 p-3 opacity-0 shadow-xl transition group-hover:opacity-100 lg:block">
                <p className="text-sm font-medium text-zinc-100">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-zinc-400">
                  {item.description}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  function closeMenu({ restoreFocus = false } = {}) {
    setIsOpen(false);
    if (restoreFocus) {
      window.setTimeout(() => menuButtonRef.current?.focus(), 0);
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const handleDesktopChange = (event: MediaQueryListEvent) => {
      if (event.matches) closeMenu();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu({ restoreFocus: true });
    };

    desktopQuery.addEventListener("change", handleDesktopChange);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      desktopQuery.removeEventListener("change", handleDesktopChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-4 lg:hidden">
        <button
          ref={menuButtonRef}
          type="button"
          aria-expanded={isOpen}
          aria-controls="mobile-creator-menu"
          aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
          onClick={() => setIsOpen((open) => !open)}
          className="grid size-11 place-items-center rounded-xl border border-white/15 text-zinc-200 transition hover:border-emerald-300/50 hover:text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60"
        >
          <MenuIcon isOpen={isOpen} />
        </button>
      </header>

      {isOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => closeMenu({ restoreFocus: true })}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />
          <aside
            id="mobile-creator-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu da área do criador"
            className="relative flex h-full w-[min(86vw,320px)] flex-col border-r border-white/10 bg-zinc-950 px-5 py-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Fechar menu"
                onClick={() => closeMenu({ restoreFocus: true })}
                className="grid size-11 place-items-center rounded-xl border border-white/15 text-zinc-300 transition hover:border-emerald-300/50 hover:text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60"
              >
                <MenuIcon isOpen />
              </button>
            </div>
            <MobileNavigation onNavigate={() => closeMenu()} />
          </aside>
        </div>
      ) : null}

      <aside className="hidden min-h-[740px] flex-col items-center border-r border-white/10 px-3 py-5 lg:flex">
        <DesktopNavigation />
      </aside>
    </>
  );
}
