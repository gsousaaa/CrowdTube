"use client";

import { ProfileForm } from "@/components/profile/profile-form";
import { useAdminProfile } from "@/hooks/use-admin-profile";

export function AdminProfilePanel() {
  const { profile, status, error, isSaving, load, save } = useAdminProfile();

  if (status === "disconnected") {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 text-zinc-400">
        Conecte sua carteira para acessar e editar seu perfil.
      </section>
    );
  }

  if (status === "authenticating") {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
        <p className="text-zinc-300">Autenticação necessária.</p>
        <p className="mt-2 text-sm text-zinc-500">
          {error ?? "Confirme a assinatura na carteira para entrar no painel."}
        </p>
      </section>
    );
  }

  if (status === "loading") {
    return <p className="text-zinc-400">Carregando perfil...</p>;
  }

  if (status === "error" || !profile) {
    return (
      <section className="rounded-3xl border border-red-300/20 bg-red-300/[0.05] p-6">
        <p role="alert" className="text-red-200">
          {error ?? "Não foi possível carregar o perfil."}
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 rounded-xl border border-red-200/20 px-4 py-2 text-sm text-red-100 transition hover:bg-red-200/10"
        >
          Tentar novamente
        </button>
      </section>
    );
  }

  return (
    <ProfileForm
      key={profile.id}
      profile={profile}
      isSaving={isSaving}
      onSave={save}
    />
  );
}
