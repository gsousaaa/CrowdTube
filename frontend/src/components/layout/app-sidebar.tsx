type SidebarItem = {
  label: string;
  description: string;
  icon: "profile" | "wallet" | "report";
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

export function AppSidebar() {
  return (
    <aside className="flex items-center gap-4 border-b border-white/10 px-4 py-4 lg:min-h-[740px] lg:flex-col lg:border-r lg:border-b-0 lg:px-3 lg:py-5">
      <div
        className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-300 font-bold text-zinc-950"
        aria-label="CrowdTube"
      >
        CT
      </div>

      <nav aria-label="Área do criador" className="min-w-0 flex-1 lg:mt-8">
        <ul className="flex gap-2 overflow-x-auto lg:flex-col">
          {navigation.map((item) => (
            <li key={item.label} className="group relative">
              <button
                type="button"
                aria-disabled="true"
                aria-label={`${item.label}: ${item.description}`}
                title={`${item.label} — será implementado em uma próxima etapa`}
                className="flex size-11 cursor-not-allowed items-center justify-center rounded-xl border border-white/10 text-zinc-500 transition hover:border-emerald-300/40 hover:bg-emerald-300/10 hover:text-emerald-200 focus-visible:border-emerald-300/60 focus-visible:text-emerald-200 focus-visible:outline-none lg:size-12"
              >
                <SidebarIcon name={item.icon} />
              </button>

              <div className="pointer-events-none absolute top-1/2 left-full z-10 ml-3 hidden w-56 -translate-y-1/2 rounded-xl border border-white/10 bg-zinc-950 p-3 opacity-0 shadow-xl transition group-hover:opacity-100 lg:block">
                <p className="text-sm font-medium text-zinc-100">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-zinc-400">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
