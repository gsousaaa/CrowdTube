import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center gap-8 px-6 py-24 bg-white text-center dark:bg-black">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold tracking-tight">
            CrowdTube
          </h1>
          <p className="max-w-xl text-zinc-600 dark:text-zinc-400">
            A plataforma Web3 de financiamento coletivo para criadores do
            YouTube.
          </p>
        </div>

        <ConnectWalletButton />
      </main>
    </div>
  );
}
