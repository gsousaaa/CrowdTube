const navigation = [
  { label: "Painel", symbol: "P", active: true },
  { label: "Campanhas", symbol: "C" },
  { label: "Doações", symbol: "D" },
  { label: "Saques", symbol: "S" },
  { label: "Perfil", symbol: "U" },
];

export function AppSidebar() {
  return (
    <aside className="flex items-center gap-4 border-b border-white/10 px-4 py-4 lg:min-h-[740px] lg:flex-col lg:border-r lg:border-b-0 lg:px-3 lg:py-5">
      <div
        className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-300 font-bold text-zinc-950"
        aria-label="CrowdTube"
      >
        CT
      </div>

      <nav aria-label="Navegação principal" className="min-w-0 flex-1 lg:mt-8">
        <ul className="flex gap-2 overflow-x-auto lg:flex-col">
          {navigation.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                aria-current={item.active ? "page" : undefined}
                title={`${item.label} — disponível em uma próxima fase`}
                className={`group flex size-11 items-center justify-center rounded-xl border text-sm font-semibold transition lg:size-12 ${
                  item.active
                    ? "border-emerald-300/50 bg-emerald-300/15 text-emerald-200"
                    : "border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-200"
                }`}
              >
                <span aria-hidden="true">{item.symbol}</span>
                <span className="sr-only">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
