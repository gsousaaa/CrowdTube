import Link from "next/link";

import { CampaignCardProgress } from "@/components/campaign/campaign-card-progress";
import type { Campaign } from "@/types/campaign";

type CampaignCardProps = {
  campaign: Campaign;
};

export function CampaignCard({ campaign }: CampaignCardProps) {
  return (
    <Link
      href={`/admin/campaigns/${campaign.id}`}
      aria-label={`Ver detalhes da campanha ${campaign.title}`}
      className="group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
    >
      <article className="h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] transition group-hover:-translate-y-1 group-hover:border-emerald-300/40 group-hover:bg-white/[0.055]">
        <div className="flex h-40 items-end bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.3),_transparent_42%),linear-gradient(145deg,_#27272a,_#111827)] p-5">
          <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-zinc-200 backdrop-blur">
            {campaign.category}
          </span>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {campaign.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {campaign.description}
            </p>
          </div>

          {campaign.hasLocalContract ? (
            <CampaignCardProgress campaignId={campaign.id} />
          ) : (
            <div>
              <div className="flex items-end justify-between gap-4">
                <p className="text-lg font-semibold text-emerald-300">
                  {campaign.raised}
                  <span className="text-sm font-normal text-zinc-500">
                    {" "}/ {campaign.goal}
                  </span>
                </p>
                <p className="text-right text-sm text-zinc-300">
                  {campaign.remaining}
                </p>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-1/2 rounded-full bg-emerald-300" />
              </div>
            </div>
          )}

          <p
            className="truncate font-mono text-xs text-zinc-500"
            title={campaign.wallet}
          >
            {campaign.wallet}
          </p>

          <span className="inline-flex text-sm font-medium text-emerald-300 transition group-hover:text-emerald-200">
            Ver detalhes da campanha →
          </span>
        </div>
      </article>
    </Link>
  );
}
