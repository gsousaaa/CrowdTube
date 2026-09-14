"use client";

import { useEffect, useState } from "react";

import { campaigns as staticCampaigns } from "@/data/campaigns";
import {
  getMockCampaignMetadata,
  MOCK_CAMPAIGNS_UPDATED_EVENT,
  type MockCampaignMetadata,
} from "@/lib/campaigns/mock-campaign-storage";
import type { Campaign } from "@/types/campaign";

const categoryLabels: Record<string, string> = {
  education: "Educação",
  entertainment: "Entretenimento",
  science: "Ciência e tecnologia",
  games: "Games",
  other: "Outra",
};

function formatRemaining(deadline: string | null) {
  if (!deadline) return "Sem prazo";

  const endOfDeadline = new Date(`${deadline}T23:59:59`);
  const millisecondsRemaining = endOfDeadline.getTime() - Date.now();
  const daysRemaining = Math.max(
    0,
    Math.ceil(millisecondsRemaining / (1000 * 60 * 60 * 24)),
  );

  return daysRemaining === 1 ? "1 dia" : `${daysRemaining} dias`;
}

function metadataToCampaign(metadata: MockCampaignMetadata): Campaign {
  return {
    id: metadata.campaignId,
    category: categoryLabels[metadata.category] ?? metadata.category,
    title: metadata.title,
    description: metadata.description,
    raised: "Consulte o contrato",
    goal: `${metadata.goalEth.replace(".", ",")} ETH`,
    remaining: formatRemaining(metadata.deadline),
    wallet: "Registrada on-chain",
    hasLocalContract: true,
    youtubeUrl: metadata.youtubeUrl,
    imageReference: metadata.imageReference,
  };
}

function loadCampaigns() {
  const campaignsById = new Map(
    staticCampaigns.map((campaign) => [campaign.id, campaign]),
  );

  for (const metadata of getMockCampaignMetadata()) {
    campaignsById.set(metadata.campaignId, metadataToCampaign(metadata));
  }

  return [...campaignsById.values()].sort(
    (first, second) => Number(first.id) - Number(second.id),
  );
}

export function useMockCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(staticCampaigns);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    function refreshCampaigns() {
      setCampaigns(loadCampaigns());
      setIsLoaded(true);
    }

    refreshCampaigns();
    window.addEventListener(MOCK_CAMPAIGNS_UPDATED_EVENT, refreshCampaigns);
    window.addEventListener("storage", refreshCampaigns);

    return () => {
      window.removeEventListener(MOCK_CAMPAIGNS_UPDATED_EVENT, refreshCampaigns);
      window.removeEventListener("storage", refreshCampaigns);
    };
  }, []);

  return { campaigns, isLoaded };
}
