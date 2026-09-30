"use client";

import { useEffect, useId, useRef, useState } from "react";
import { readContract } from "thirdweb";

import { useLanguage } from "@/i18n/language-provider";
import type { ApiCampaign } from "@/lib/api/campaigns";
import { openCampaignCreation } from "@/lib/api/events";
import { formatEther } from "@/lib/web3/campaign-values";
import { crowdTubeCampaignsContract } from "@/lib/web3/crowdtube-campaigns-contract";
import { crowdTubeChain } from "@/lib/web3/network";

function OptionsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="19" cy="12" r="1.75" />
    </svg>
  );
}

function CloneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
      <rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function formatDeadlineInput(deadline: bigint) {
  const date = new Date(Number(deadline) * 1_000);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function CampaignOptionsMenu({ campaign }: { campaign: ApiCampaign }) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
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

  async function handleClone() {
    setIsPreparing(true);
    let goalEth: string | undefined;
    let deadline: string | undefined;

    const isConfiguredContract = campaign.chainId === crowdTubeChain.id &&
      campaign.contractAddress?.toLowerCase() === crowdTubeCampaignsContract.address.toLowerCase();

    try {
      if (campaign.onchainCampaignId && isConfiguredContract) {
        const onchainCampaign = await readContract({
          contract: crowdTubeCampaignsContract,
          method: "getCampaign",
          params: [BigInt(campaign.onchainCampaignId)],
        });
        goalEth = formatEther(onchainCampaign.goal, 18);
        if (onchainCampaign.deadline > 0n) {
          deadline = formatDeadlineInput(onchainCampaign.deadline);
        }
      }
    } catch {
      // The reusable offchain fields can still be copied when onchain data is unavailable.
    }

    openCampaignCreation({ campaign, goalEth, deadline });
    setIsPreparing(false);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="absolute top-4 right-4 z-30">
      <button
        ref={triggerRef}
        type="button"
        aria-label={t("campaign.options.open")}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        title={t("campaign.options.open")}
        onClick={() => setIsOpen((current) => !current)}
        className="grid size-10 place-items-center rounded-xl border border-white/15 bg-black/60 text-zinc-200 shadow-lg backdrop-blur transition hover:border-emerald-300/50 hover:bg-zinc-900 hover:text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60"
      >
        <OptionsIcon />
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label={t("campaign.options.title")}
          className="absolute top-full right-0 mt-2 w-56 rounded-2xl border border-emerald-300/20 bg-zinc-950/95 p-2 text-zinc-100 shadow-[0_20px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl"
        >
          <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
            {t("campaign.options.title")}
          </p>
          <button
            type="button"
            role="menuitem"
            disabled={isPreparing}
            onClick={() => void handleClone()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40 disabled:cursor-wait disabled:opacity-60"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-emerald-300">
              <CloneIcon />
            </span>
            <span className="font-medium">
              {isPreparing ? t("campaign.options.preparingCopy") : t("campaign.options.clone")}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
