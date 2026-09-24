"use client";

import { FormEvent, useState } from "react";

import type {
  AdminProfile,
  UpdateAdminProfileInput,
} from "@/lib/api/profile";

type SaveMessage =
  | { type: "success"; text: string }
  | { type: "info"; text: string }
  | { type: "error"; text: string };

function normalizeOptionalValue(value: string) {
  const normalized = value.trim();
  return normalized || null;
}

function shortenAddress(address: string) {
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function formatVerifiedAt(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ProfileForm({
  profile,
  isSaving,
  onSave,
}: {
  profile: AdminProfile;
  isSaving: boolean;
  onSave: (input: UpdateAdminProfileInput) => Promise<AdminProfile>;
}) {
  const [message, setMessage] = useState<SaveMessage>();
  const [fields, setFields] = useState({
    displayName: profile.displayName ?? "",
    bio: profile.bio ?? "",
    youtubeChannelUrl: profile.youtubeChannelUrl ?? "",
  });
  const initial = profile.displayName?.trim().charAt(0).toUpperCase() || "?";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(undefined);

    const values = {
      displayName: normalizeOptionalValue(fields.displayName),
      bio: normalizeOptionalValue(fields.bio),
      youtubeChannelUrl: normalizeOptionalValue(fields.youtubeChannelUrl),
    };
    const changes: UpdateAdminProfileInput = {};

    if (values.displayName !== profile.displayName) {
      changes.displayName = values.displayName;
    }
    if (values.bio !== profile.bio) {
      changes.bio = values.bio;
    }
    if (values.youtubeChannelUrl !== profile.youtubeChannelUrl) {
      changes.youtubeChannelUrl = values.youtubeChannelUrl;
    }

    if (Object.keys(changes).length === 0) {
      setMessage({ type: "info", text: "Nenhuma alteração para salvar." });
      return;
    }

    try {
      const updatedProfile = await onSave(changes);
      setFields({
        displayName: updatedProfile.displayName ?? "",
        bio: updatedProfile.bio ?? "",
        youtubeChannelUrl: updatedProfile.youtubeChannelUrl ?? "",
      });
      setMessage({ type: "success", text: "Perfil atualizado com sucesso." });
    } catch (cause) {
      setMessage({
        type: "error",
        text: cause instanceof Error
          ? cause.message
          : "Não foi possível atualizar o perfil.",
      });
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <form
        onSubmit={handleSubmit}
        onInput={() => setMessage(undefined)}
        className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-7"
      >
        <div className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center">
          <div
            role="img"
            aria-label={`Avatar de ${profile.displayName ?? "criador"}`}
            className="grid size-20 shrink-0 place-items-center rounded-3xl bg-emerald-300 text-2xl font-bold text-zinc-950"
          >
            {initial}
          </div>
          <div>
            <h2 className="text-xl font-semibold">Informações públicas</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-400">
              Estes dados são armazenados no PostgreSQL e poderão ser exibidos
              nas páginas públicas das suas campanhas.
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              O upload da foto será conectado quando a API puder associar a
              imagem enviada ao perfil.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <label className="block space-y-2 text-sm text-zinc-300">
            <span>Nome de exibição</span>
            <input
              name="displayName"
              type="text"
              value={fields.displayName}
              onChange={(event) => setFields((current) => ({
                ...current,
                displayName: event.target.value,
              }))}
              maxLength={100}
              placeholder="Como seu nome aparecerá nas campanhas"
              className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
            />
          </label>

          <label className="block space-y-2 text-sm text-zinc-300">
            <span>Biografia</span>
            <textarea
              name="bio"
              value={fields.bio}
              onChange={(event) => setFields((current) => ({
                ...current,
                bio: event.target.value,
              }))}
              maxLength={500}
              rows={6}
              placeholder="Conte brevemente sobre seu conteúdo e sua comunidade."
              className="w-full resize-y rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 leading-6 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
            />
          </label>

          <label className="block space-y-2 text-sm text-zinc-300">
            <span>Canal no YouTube</span>
            <input
              name="youtubeChannelUrl"
              type="url"
              value={fields.youtubeChannelUrl}
              onChange={(event) => setFields((current) => ({
                ...current,
                youtubeChannelUrl: event.target.value,
              }))}
              placeholder="https://youtube.com/@seu-canal"
              className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
            />
            <span className="block text-xs leading-5 text-zinc-500">
              O backend aceita somente endereços do YouTube ou youtu.be.
            </span>
          </label>
        </div>

        <div className="mt-7 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div aria-live="polite" className="min-h-6 text-sm">
            {message?.type === "success" && (
              <p className="text-emerald-200">{message.text}</p>
            )}
            {message?.type === "info" && (
              <p className="text-zinc-400">{message.text}</p>
            )}
            {message?.type === "error" && (
              <p role="alert" className="text-red-300">{message.text}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="h-11 rounded-xl bg-emerald-300 px-5 font-semibold text-zinc-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>

      <aside className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">
          Carteiras vinculadas
        </p>
        <h2 className="mt-2 text-xl font-semibold">Seus endereços</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          A carteira autenticada determina qual sessão está usando o painel. A
          propriedade financeira continua registrada no contrato.
        </p>

        <ul className="mt-6 space-y-3">
          {profile.wallets.map((wallet) => {
            const isAuthenticated = wallet.walletAddress.toLowerCase() ===
              profile.authenticatedWalletAddress.toLowerCase();

            return (
              <li key={wallet.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  {wallet.isPrimary && (
                    <span className="rounded-full bg-emerald-300/10 px-2.5 py-1 text-xs text-emerald-200">
                      Principal
                    </span>
                  )}
                  {isAuthenticated && (
                    <span className="rounded-full bg-sky-300/10 px-2.5 py-1 text-xs text-sky-200">
                      Sessão atual
                    </span>
                  )}
                </div>
                <p className="mt-3 break-all font-mono text-sm text-zinc-200" title={wallet.walletAddress}>
                  {shortenAddress(wallet.walletAddress)}
                </p>
                {wallet.label && <p className="mt-1 text-sm text-zinc-400">{wallet.label}</p>}
                <p className="mt-2 text-xs text-zinc-500">
                  Verificada em {formatVerifiedAt(wallet.verifiedAt)}
                </p>
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}
