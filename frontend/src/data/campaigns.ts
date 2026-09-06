import { Campaign } from "@/types/campaign";

export const campaigns: Campaign[] = [
  {
    id: "1",
    category: "Educação",
    title: "Laboratório aberto de programação",
    description: "Equipamentos para uma nova série gratuita de aulas práticas.",
    raised: "0,24 ETH",
    goal: "0,50 ETH",
    remaining: "7 dias",
    wallet: "0xfa6f...49f5",
    hasLocalContract: true,
  },
  {
    id: "2",
    category: "Vlogs",
    title: "Documentário independente",
    description: "Ajude a financiar viagem, captação e edição do próximo vídeo.",
    raised: "0,10 ETH",
    goal: "0,50 ETH",
    remaining: "20 dias",
    wallet: "0x3b21...8a10",
    hasLocalContract: false,
  },
  {
    id: "3",
    category: "Ciência",
    title: "Ciência acessível no YouTube",
    description: "Uma temporada de experimentos explicados de forma simples.",
    raised: "0,35 ETH",
    goal: "0,80 ETH",
    remaining: "2 semanas",
    wallet: "0x89bc...11d2",
    hasLocalContract: false,
  },
];

export function findCampaignById(id: string) {
  return campaigns.find((campaign) => campaign.id === id);
}
