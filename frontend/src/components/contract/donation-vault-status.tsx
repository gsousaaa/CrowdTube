"use client";

import { useReadContract } from "thirdweb/react";

import { donationVaultContract } from "@/lib/web3/donation-vault-contract";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

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

export function DonationVaultStatus() {
  const owner = useReadContract({
    contract: donationVaultContract,
    method: "owner",
  });
  const campaignId = useReadContract({
    contract: donationVaultContract,
    method: "campaignId",
  });
  const totalDonated = useReadContract({
    contract: donationVaultContract,
    method: "totalDonated",
  });

  const isLoading =
    owner.isLoading || campaignId.isLoading || totalDonated.isLoading;
  const hasError = owner.isError || campaignId.isError || totalDonated.isError;

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
            DonationVault
          </h2>
        </div>
        <span className="rounded-full bg-amber-300/10 px-3 py-1 text-xs text-amber-200">
          Hardhat · chain 31337
        </span>
      </div>

      {isLoading ? (
        <p className="mt-5 text-sm text-zinc-400">
          Consultando o contrato na blockchain local...
        </p>
      ) : hasError ? (
        <div className="mt-5" role="alert">
          <p className="text-sm font-medium text-red-300">
            Não foi possível consultar o DonationVault.
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Confirme se o node do Hardhat está em execução e se o endereço no
            arquivo .env pertence ao deploy atual.
          </p>
        </div>
      ) : (
        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wider text-zinc-500">
              Campanha
            </dt>
            <dd className="mt-1 text-sm">#{campaignId.data?.toString()}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-zinc-500">
              Responsável
            </dt>
            <dd
              className="mt-1 font-mono text-sm"
              title={owner.data?.toString()}
            >
              {owner.data ? shortenAddress(owner.data.toString()) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-zinc-500">
              Total recebido
            </dt>
            <dd className="mt-1 text-sm">
              {totalDonated.data === undefined
                ? "—"
                : `${formatEther(totalDonated.data)} ETH`}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
