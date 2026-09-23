"use client";

import { useCallback, useEffect, useState } from "react";
import { prepareContractCall, readContract, waitForReceipt } from "thirdweb";
import {
  useActiveAccount,
  useSendTransaction,
} from "thirdweb/react";

import { useAdminCampaigns } from "@/hooks/use-admin-campaigns";
import { crowdTubeCampaignsContract } from "@/lib/web3/crowdtube-campaigns-contract";
import { notifyContractDataUpdated } from "@/lib/web3/contract-events";
import { crowdTubeChain } from "@/lib/web3/network";

type CreatorCampaignBalance = {
  campaignId: string;
  title: string;
  availableBalance: bigint;
};

type WithdrawalStatus =
  | "idle"
  | "awaiting-signature"
  | "sent"
  | "confirmed"
  | "error";

function formatEther(value: bigint) {
  const formatted = value.toString().padStart(19, "0");
  const wholePart = formatted.slice(0, -18);
  const decimalPart = formatted.slice(-18).replace(/0+$/, "").slice(0, 6);

  return decimalPart ? `${wholePart}.${decimalPart}` : wholePart;
}

export function CreatorBalancePanel() {
  const { campaigns, status: campaignStatus, error: campaignError } = useAdminCampaigns();
  const [creatorCampaigns, setCreatorCampaigns] =
    useState<CreatorCampaignBalance[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [status, setStatus] = useState<WithdrawalStatus>("idle");
  const [error, setError] = useState<string>();
  const account = useActiveAccount();
  const sendTransaction = useSendTransaction({ payModal: false });

  const loadCreatorBalances = useCallback(async () => {
    if (!account || campaignStatus !== "ready") {
      setCreatorCampaigns([]);
      return;
    }

    setIsLoadingBalances(true);

    const results = await Promise.allSettled(
      campaigns
        .filter((campaign) =>
          campaign.status === "published" &&
          campaign.onchainCampaignId !== null &&
          campaign.chainId === crowdTubeChain.id &&
          campaign.contractAddress?.toLowerCase() === crowdTubeCampaignsContract.address.toLowerCase(),
        )
        .map(async (campaign) => {
          const campaignId = BigInt(campaign.onchainCampaignId!);
          const onchainCampaign = await readContract({
            contract: crowdTubeCampaignsContract,
            method: "getCampaign",
            params: [campaignId],
          });

          if (
            onchainCampaign.creator.toLowerCase() !==
            account.address.toLowerCase()
          ) {
            return undefined;
          }

          const availableBalance = await readContract({
            contract: crowdTubeCampaignsContract,
            method: "getAvailableBalance",
            params: [campaignId],
          });

          return {
            campaignId: campaign.onchainCampaignId!,
            title: campaign.title,
            availableBalance,
          };
        }),
    );

    setCreatorCampaigns(
      results.flatMap((result) =>
        result.status === "fulfilled" && result.value ? [result.value] : [],
      ),
    );
    setIsLoadingBalances(false);
  }, [account, campaigns, campaignStatus]);

  useEffect(() => {
    const refreshTimeout = window.setTimeout(() => {
      void loadCreatorBalances();
    }, 0);

    return () => window.clearTimeout(refreshTimeout);
  }, [loadCreatorBalances]);

  const visibleCreatorCampaigns = campaignStatus === "ready" ? creatorCampaigns : [];
  const totalAvailable = visibleCreatorCampaigns.reduce(
    (total, campaign) => total + campaign.availableBalance,
    0n,
  );
  const campaignsWithBalance = visibleCreatorCampaigns.filter(
    (campaign) => campaign.availableBalance > 0n,
  );
  const isProcessing =
    status === "awaiting-signature" ||
    status === "sent";

  async function withdrawAllAvailable() {
    setError(undefined);

    try {
      if (!account) throw new Error("Conecte sua carteira para realizar o saque.");
      if (campaignsWithBalance.length === 0) {
        throw new Error("Não há saldo disponível para sacar.");
      }

      const transaction = prepareContractCall({
        contract: crowdTubeCampaignsContract,
        method: "withdrawFromCampaigns",
        params: [
          campaignsWithBalance.map((campaign) => BigInt(campaign.campaignId)),
        ],
      });

      setStatus("awaiting-signature");
      const sentTransaction = await sendTransaction.mutateAsync(transaction);
      setStatus("sent");
      await waitForReceipt(sentTransaction);

      setStatus("confirmed");
      await loadCreatorBalances();
      notifyContractDataUpdated();
    } catch (withdrawalError) {
      setStatus("error");
      setError(
        withdrawalError instanceof Error
          ? withdrawalError.message
          : "Não foi possível concluir o saque geral.",
      );
    }
  }

  return (
    <section className="rounded-3xl border border-emerald-300/20 bg-emerald-300/[0.05] p-6 sm:p-8">
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">
        Saldo consolidado
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm text-zinc-400">Disponível em suas campanhas</p>
          <p className="mt-1 text-4xl font-semibold text-emerald-300">
            {isLoadingBalances ? "..." : `${formatEther(totalAvailable)} ETH`}
          </p>
        </div>
        <button
          type="button"
          onClick={withdrawAllAvailable}
          disabled={!account || campaignStatus !== "ready" || totalAvailable === 0n || isProcessing}
          className="h-11 rounded-xl bg-emerald-300 px-5 font-semibold text-zinc-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "awaiting-signature" && "Confirme na carteira..."}
          {status === "sent" && "Aguardando confirmação..."}
          {(status === "idle" || status === "confirmed" || status === "error") &&
            "Sacar saldo total"}
        </button>
      </div>

      {!account ? (
        <p className="mt-5 text-sm text-zinc-400">
          Conecte a carteira para identificar suas campanhas.
        </p>
      ) : campaignStatus === "sign-in-required" ? (
        <div className="mt-5">
          <p className="text-sm text-zinc-400">Abra o menu da carteira acima para autenticar novamente ou trocar de carteira.</p>
          {campaignError && <p role="alert" className="mt-2 text-sm text-amber-200">{campaignError}</p>}
        </div>
      ) : campaignStatus === "error" ? (
        <p role="alert" className="mt-5 text-sm text-red-300">{campaignError}</p>
      ) : (
        <div className="mt-7 space-y-3">
          {visibleCreatorCampaigns.map((campaign) => (
            <div
              key={campaign.campaignId}
              className="flex items-center justify-between gap-4 rounded-xl bg-black/25 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-zinc-200">
                  {campaign.title}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Campanha #{campaign.campaignId}
                </p>
              </div>
              <p className="text-sm text-emerald-200">
                {formatEther(campaign.availableBalance)} ETH
              </p>
            </div>
          ))}
          {!isLoadingBalances && visibleCreatorCampaigns.length === 0 ? (
            <p className="text-sm text-zinc-400">
              Nenhuma campanha publicada desta carteira possui saldo disponível.
            </p>
          ) : null}
        </div>
      )}

      <div aria-live="polite" className="mt-4 min-h-6">
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {status === "confirmed" ? (
          <p className="text-sm text-emerald-200">
            Saque geral confirmado e saldos atualizados.
          </p>
        ) : null}
      </div>
    </section>
  );
}
