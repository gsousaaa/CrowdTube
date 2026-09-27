"use client";

import Image from "next/image";
import {
  DragEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useMediaUrl } from "@/hooks/use-media-url";
import { useLanguage } from "@/i18n/language-provider";
import { MediaUploadError, uploadProfileAvatar } from "@/lib/api/media";
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

function formatVerifiedAt(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
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
  const { intlLocale, t } = useLanguage();
  const [message, setMessage] = useState<SaveMessage>();
  const [avatarFile, setAvatarFile] = useState<File>();
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [fields, setFields] = useState({
    displayName: profile.displayName ?? "",
    bio: profile.bio ?? "",
    youtubeChannelUrl: profile.youtubeChannelUrl ?? "",
  });
  const initial = profile.displayName?.trim().charAt(0).toUpperCase() || "?";
  const { url: storedAvatarUrl } = useMediaUrl(profile.avatarObjectKey);
  const avatarPreviewUrl = useMemo(
    () => avatarFile ? URL.createObjectURL(avatarFile) : undefined,
    [avatarFile],
  );
  const displayedAvatarUrl = removeAvatar
    ? undefined
    : avatarPreviewUrl ?? storedAvatarUrl;

  useEffect(() => () => {
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
  }, [avatarPreviewUrl]);

  function selectAvatarFile(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage({
        type: "error",
        text: t("profile.invalidImage"),
      });
      return;
    }

    setAvatarFile(file);
    setRemoveAvatar(false);
    setMessage(undefined);
  }

  function handleAvatarDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) selectAvatarFile(file);
  }

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

    if (
      Object.keys(changes).length === 0 &&
      !avatarFile &&
      !(removeAvatar && profile.avatarObjectKey)
    ) {
      setMessage({ type: "info", text: t("profile.noChanges") });
      return;
    }

    try {
      if (avatarFile) {
        setIsUploadingAvatar(true);
        changes.avatarObjectKey = await uploadProfileAvatar(avatarFile);
      } else if (removeAvatar && profile.avatarObjectKey) {
        changes.avatarObjectKey = null;
      }

      const updatedProfile = await onSave(changes);
      setFields({
        displayName: updatedProfile.displayName ?? "",
        bio: updatedProfile.bio ?? "",
        youtubeChannelUrl: updatedProfile.youtubeChannelUrl ?? "",
      });
      setAvatarFile(undefined);
      setRemoveAvatar(false);
      setMessage({ type: "success", text: t("profile.updated") });
    } catch (cause) {
      setMessage({
        type: "error",
        text: cause instanceof MediaUploadError
          ? cause.code === "INVALID_TYPE"
            ? t("profile.invalidImage")
            : t("media.uploadError")
          : cause instanceof Error
            ? cause.message
            : t("profile.updateError"),
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  const isSubmitting = isSaving || isUploadingAvatar;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <form
        onSubmit={handleSubmit}
        onInput={() => setMessage(undefined)}
        className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-7"
      >
        <div className="border-b border-white/10 pb-6">
          <h2 className="text-xl font-semibold">{t("profile.photo")}</h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-400">
            {t("profile.photoDescription")}
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-[96px_minmax(0,1fr)] sm:items-stretch">
            <div className="relative grid size-24 place-items-center overflow-hidden rounded-3xl bg-emerald-300 text-3xl font-bold text-zinc-950">
              {displayedAvatarUrl ? (
                <Image
                  src={displayedAvatarUrl}
                  alt={t("profile.avatarAlt", { name: profile.displayName ?? t("common.creator") })}
                  fill
                  sizes="96px"
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <span aria-hidden="true">{initial}</span>
              )}
            </div>

            <div className="min-w-0">
              <label
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleAvatarDrop}
                className="flex min-h-24 cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-white/20 bg-white/[0.025] px-5 py-4 transition hover:border-emerald-300/50 hover:bg-emerald-300/[0.04] focus-within:border-emerald-300/60 focus-within:ring-2 focus-within:ring-emerald-300/10"
              >
                <span
                  aria-hidden="true"
                  className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-300/10 text-xl text-emerald-200"
                >
                  ↑
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-zinc-200">
                    {avatarFile
                      ? t("profile.changeImage")
                      : t("profile.selectImage")}
                  </span>
                  <span className="mt-1 block truncate text-xs text-zinc-500">
                    {avatarFile?.name ?? "JPG, PNG ou WebP"}
                  </span>
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) selectAvatarFile(file);
                    event.target.value = "";
                  }}
                />
              </label>

              <div className="mt-3 flex flex-wrap items-center gap-4">
                {avatarFile && (
                  <button
                    type="button"
                    onClick={() => setAvatarFile(undefined)}
                    className="text-xs text-zinc-400 transition hover:text-white"
                  >
                    {t("profile.cancelNewImage")}
                  </button>
                )}

                {!avatarFile && profile.avatarObjectKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setRemoveAvatar((current) => !current);
                      setMessage(undefined);
                    }}
                    className="text-xs text-zinc-400 transition hover:text-white"
                  >
                    {removeAvatar ? t("profile.keepPhoto") : t("profile.removePhoto")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold">{t("profile.information")}</h2>
        </div>

        <div className="mt-6 space-y-5">
          <label className="block space-y-2 text-sm text-zinc-300">
            <span>{t("profile.displayName")}</span>
            <input
              name="displayName"
              type="text"
              value={fields.displayName}
              onChange={(event) => setFields((current) => ({
                ...current,
                displayName: event.target.value,
              }))}
              maxLength={100}
              placeholder={t("profile.displayNamePlaceholder")}
              className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
            />
          </label>

          <label className="block space-y-2 text-sm text-zinc-300">
            <span>{t("profile.bio")}</span>
            <textarea
              name="bio"
              value={fields.bio}
              onChange={(event) => setFields((current) => ({
                ...current,
                bio: event.target.value,
              }))}
              maxLength={500}
              rows={6}
              placeholder={t("profile.bioPlaceholder")}
              className="w-full resize-y rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 leading-6 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
            />
          </label>

          <label className="block space-y-2 text-sm text-zinc-300">
            <span>{t("profile.youtubeChannel")}</span>
            <input
              name="youtubeChannelUrl"
              type="url"
              value={fields.youtubeChannelUrl}
              onChange={(event) => setFields((current) => ({
                ...current,
                youtubeChannelUrl: event.target.value,
              }))}
              placeholder={t("profile.youtubePlaceholder")}
              className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
            />
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
            disabled={isSubmitting}
            className="h-11 rounded-xl bg-emerald-300 px-5 font-semibold text-zinc-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploadingAvatar
              ? t("profile.uploadingPhoto")
              : isSaving
                ? t("profile.saving")
                : t("profile.save")}
          </button>
        </div>
      </form>

      <aside className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">
          {t("profile.linkedWallets")}
        </p>
        <h2 className="mt-2 text-xl font-semibold">{t("profile.addresses")}</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          {t("profile.walletDescription")}
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
                      {t("profile.primary")}
                    </span>
                  )}
                  {isAuthenticated && (
                    <span className="rounded-full bg-sky-300/10 px-2.5 py-1 text-xs text-sky-200">
                      {t("profile.currentSession")}
                    </span>
                  )}
                </div>
                <p className="mt-3 break-all font-mono text-sm text-zinc-200" title={wallet.walletAddress}>
                  {shortenAddress(wallet.walletAddress)}
                </p>
                {wallet.label && <p className="mt-1 text-sm text-zinc-400">{wallet.label}</p>}
                <p className="mt-2 text-xs text-zinc-500">
                  {t("profile.verifiedAt", { date: formatVerifiedAt(wallet.verifiedAt, intlLocale) })}
                </p>
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}
