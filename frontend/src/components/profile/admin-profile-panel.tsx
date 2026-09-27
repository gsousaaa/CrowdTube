"use client";

import { ProfileForm } from "@/components/profile/profile-form";
import { useAdminProfile } from "@/hooks/use-admin-profile";
import { useLanguage } from "@/i18n/language-provider";

export function AdminProfilePanel() {
  const { t } = useLanguage();
  const { profile, status, error, isSaving, load, save } = useAdminProfile();

  if (status === "disconnected") {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 text-zinc-400">
        {t("profile.connect")}
      </section>
    );
  }

  if (status === "authenticating") {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
        <p className="text-zinc-300">{t("profile.authenticationRequired")}</p>
        <p className="mt-2 text-sm text-zinc-500">
          {error ?? t("profile.confirmSignature")}
        </p>
      </section>
    );
  }

  if (status === "loading") {
    return <p className="text-zinc-400">{t("profile.loading")}</p>;
  }

  if (status === "error" || !profile) {
    return (
      <section className="rounded-3xl border border-red-300/20 bg-red-300/[0.05] p-6">
        <p role="alert" className="text-red-200">
          {error ?? t("profile.loadError")}
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 rounded-xl border border-red-200/20 px-4 py-2 text-sm text-red-100 transition hover:bg-red-200/10"
        >
          {t("common.tryAgain")}
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
