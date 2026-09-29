"use client";

import { useRouter } from "next/navigation";

import { ProfileForm } from "@/components/profile/profile-form";
import { useAdminProfile } from "@/hooks/use-admin-profile";
import { useLanguage } from "@/i18n/language-provider";
import type { UpdateAdminProfileInput } from "@/lib/api/profile";

export function ProfileOnboarding() {
  const router = useRouter();
  const { t } = useLanguage();
  const { profile, status, error, isSaving, load, save } = useAdminProfile();

  async function saveAndContinue(input: UpdateAdminProfileInput) {
    const updatedProfile = await save(input);
    router.replace("/admin");
    return updatedProfile;
  }

  if (status === "error" || (status === "ready" && !profile)) {
    return (
      <section className="mx-auto mt-16 max-w-xl rounded-3xl border border-red-300/20 bg-red-300/[0.05] p-7 text-center">
        <p role="alert" className="text-red-200">
          {error ?? t("profile.loadError")}
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-5 rounded-xl border border-red-200/20 px-4 py-2 text-sm text-red-100 transition hover:bg-red-200/10"
        >
          {t("common.tryAgain")}
        </button>
      </section>
    );
  }

  if (status !== "ready" || !profile) {
    return (
      <section className="mx-auto mt-20 flex max-w-md flex-col items-center text-center">
        <span className="size-8 animate-spin rounded-full border-2 border-emerald-300/20 border-t-emerald-300" />
        <p className="mt-5 text-sm text-zinc-400">
          {t("login.preparingProfile")}
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl py-10 sm:py-14">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            {t("login.onboardingStep")}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {t("login.onboardingTitle")}
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400 sm:text-base">
            {t("login.onboardingDescription")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.replace("/admin")}
          className="self-start text-sm text-zinc-400 underline decoration-white/20 underline-offset-4 transition hover:text-white sm:self-auto"
        >
          {t("login.skipProfile")}
        </button>
      </div>

      <ProfileForm
        profile={profile}
        isSaving={isSaving}
        onSave={saveAndContinue}
        submitLabel={t("login.saveAndContinue")}
        requireDisplayName
      />
    </section>
  );
}
