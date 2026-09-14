"use client";

import { useReadContract } from "thirdweb/react";

import { crowdTubeCampaignsContract } from "@/lib/web3/crowdtube-campaigns-contract";

function formatEther(value: bigint) {
  const weiPerEther = BigInt("1000000000000000000");
  const wholePart = value / weiPerEther;
  const decimalPart = (value % weiPerEther)
    .toString()
    .padStart(18, "0")
    .replace(/0+$/, "")
    .slice(0, 4);

  return decimalPart ? `${wholePart}.${decimalPart}` : wholePart.toString();
}

function formatDeadline(deadline: bigint) {
  if (deadline === 0n) return "Sem prazo";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(Number(deadline) * 1_000));
}

type CampaignContractStatusProps = {
  campaignId: string;
};

export function CampaignContractStatus({
  campaignId,
}: CampaignContractStatusProps) {
  const onchainCampaignId = BigInt(campaignId);
  const campaign = useReadContract({
    contract: crowdTubeCampaignsContract,
    method: "getCampaign",
    params: [onchainCampaignId],
  });
  const availableBalance = useReadContract({
    contract: crowdTubeCampaignsContract,
    method: "getAvailableBalance",
    params: [onchainCampaignId],
  });

  const isLoading = campaign.isLoading || availableBalance.isLoading;
  const hasError = campaign.isError || availableBalance.isError;

  return (
    <section
      aria-labelledby="contract-status-heading"
      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Contrato local
          </p>
          <h2 id="contract-status-heading" className="mt-1 font-medium">
            CrowdTubeCampaigns · campanha #{campaignId}
          </h2>
        </div>
        <span className="rounded-full bg-amber-300/10 px-3 py-1 text-xs text-amber-200">
          Hardhat · chain 31337
        </span>
      </div>

      {isLoading ? (
        <p className="mt-5 text-sm text-zinc-400">
          Consultando a campanha na blockchain local...
        </p>
      ) : hasError || !campaign.data ? (
        <div className="mt-5" role="alert">
          <p className="text-sm font-medium text-red-300">
            Não foi possível consultar a campanha #{campaignId}.
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Confirme se o node está ativo, se o endereço pertence ao deploy atual
            e se essa campanha já foi criada no contrato.
          </p>
        </div>
      ) : (
        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wider text-zinc-500">
              Total recebido
            </dt>
            <dd className="mt-1 text-sm">
              {formatEther(campaign.data.totalRaised)} ETH
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-zinc-500">
              Saldo disponível
            </dt>
            <dd className="mt-1 text-sm">
              {availableBalance.data === undefined
                ? "—"
                : `${formatEther(availableBalance.data)} ETH`}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-zinc-500">
              Prazo
            </dt>
            <dd className="mt-1 text-sm">
              {formatDeadline(campaign.data.deadline)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-zinc-500">
              Estado
            </dt>
            <dd className="mt-1 text-sm">
              {campaign.data.active ? "Ativa" : "Inativa"}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
