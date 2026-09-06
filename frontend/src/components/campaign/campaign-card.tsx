type CampaignCardProps = {
  category: string;
  title: string;
  description: string;
  raised: string;
  goal: string;
  remaining: string;
  wallet: string;
};

export function CampaignCard({
  category,
  title,
  description,
  raised,
  goal,
  remaining,
  wallet,
}: CampaignCardProps) {


  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] transition hover:-translate-y-1 hover:border-emerald-300/40 hover:bg-white/[0.055]">
      <div className="flex h-40 items-end bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.3),_transparent_42%),linear-gradient(145deg,_#27272a,_#111827)] p-5">
        <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-zinc-200 backdrop-blur">
          {category}
        </span>
      </div>

      <div className="space-y-5 p-5">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              Arrecadado
            </p>
            <p className="mt-1 text-lg font-semibold text-emerald-300">
              {raised}
              <span className="text-sm font-normal text-zinc-500"> / {goal}</span>
            </p>
          </div>
          <p className="text-right text-sm text-zinc-300">{remaining}</p>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 rounded-full bg-emerald-300" />
        </div>

        <p className="truncate font-mono text-xs text-zinc-500" title={wallet}>
          {wallet}
        </p>
      </div>
    </article>
  );
}
