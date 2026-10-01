"use client";

import Image from "next/image";
import {
  FormEvent,
  MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAdminWalletAuth } from "@/components/wallet/admin-wallet-auth-provider";
import { useMediaUrl } from "@/hooks/use-media-url";
import { useLanguage } from "@/i18n/language-provider";
import {
  updateCampaign,
  type CampaignCategory,
  type UpdateCampaignInput,
} from "@/lib/api/campaigns";
import { ApiError } from "@/lib/api/client";
import {
  type CampaignUpdatePrefill,
  notifyCampaignsUpdated,
  OPEN_CAMPAIGN_UPDATE_EVENT,
} from "@/lib/api/events";
import { MediaUploadError, uploadCampaignImage } from "@/lib/api/media";

type UpdateStatus = "idle" | "uploading-image" | "saving" | "success" | "info" | "error";

type EditableFields = {
  title: string;
  category: CampaignCategory;
  description: string;
  youtubeUrl: string;
};

const emptyFields: EditableFields = {
  title: "",
  category: "other",
  description: "",
  youtubeUrl: "",
};

export function UpdateCampaignModal() {
  const { t } = useLanguage();
  const adminAuth = useAdminWalletAuth();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [campaign, setCampaign] = useState<CampaignUpdatePrefill>();
  const [fields, setFields] = useState<EditableFields>(emptyFields);
  const [coverImage, setCoverImage] = useState<File>();
  const [removeCover, setRemoveCover] = useState(false);
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [error, setError] = useState<string>();
  const { url: storedCoverUrl } = useMediaUrl(campaign?.imageObjectKey);
  const coverPreviewUrl = useMemo(
    () => coverImage ? URL.createObjectURL(coverImage) : undefined,
    [coverImage],
  );
  const displayedCoverUrl = removeCover
    ? undefined
    : coverPreviewUrl ?? storedCoverUrl;

  useEffect(() => () => {
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
  }, [coverPreviewUrl]);

  useEffect(() => {
    function handleOpenCampaignUpdate(event: Event) {
      const selectedCampaign = (
        event as CustomEvent<CampaignUpdatePrefill>
      ).detail;

      setCampaign(selectedCampaign);
      setFields({
        title: selectedCampaign.title,
        category: selectedCampaign.category,
        description: selectedCampaign.description,
        youtubeUrl: selectedCampaign.youtubeUrl,
      });
      setCoverImage(undefined);
      setRemoveCover(false);
      setStatus("idle");
      setError(undefined);
      dialogRef.current?.showModal();
    }

    window.addEventListener(OPEN_CAMPAIGN_UPDATE_EVENT, handleOpenCampaignUpdate);
    return () => window.removeEventListener(
      OPEN_CAMPAIGN_UPDATE_EVENT,
      handleOpenCampaignUpdate,
    );
  }, []);

  function closeModal() {
    dialogRef.current?.close();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) closeModal();
  }

  function selectCoverImage(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setStatus("error");
      setError(t("profile.invalidImage"));
      return;
    }

    setCoverImage(file);
    setRemoveCover(false);
    setStatus("idle");
    setError(undefined);
  }

  function updateField<TKey extends keyof EditableFields>(
    field: TKey,
    value: EditableFields[TKey],
  ) {
    setFields((current) => ({ ...current, [field]: value }));
    setStatus("idle");
    setError(undefined);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!campaign) return;

    setStatus("idle");
    setError(undefined);

    const normalized = {
      title: fields.title.trim(),
      category: fields.category,
      description: fields.description.trim(),
      youtubeUrl: fields.youtubeUrl.trim(),
    };
    const changes: UpdateCampaignInput = {};

    if (normalized.title !== campaign.title) changes.title = normalized.title;
    if (normalized.category !== campaign.category) {
      changes.category = normalized.category;
    }
    if (normalized.description !== campaign.description) {
      changes.description = normalized.description;
    }
    if (normalized.youtubeUrl !== campaign.youtubeUrl) {
      changes.youtubeUrl = normalized.youtubeUrl;
    }

    try {
      if (coverImage) {
        setStatus("uploading-image");
        changes.imageObjectKey = await uploadCampaignImage(coverImage);
      } else if (removeCover && campaign.imageObjectKey) {
        changes.imageObjectKey = null;
      }

      if (Object.keys(changes).length === 0) {
        setStatus("info");
        return;
      }

      setStatus("saving");
      const updated = await updateCampaign(campaign.id, changes);
      setCampaign(updated);
      setFields({
        title: updated.title,
        category: updated.category,
        description: updated.description,
        youtubeUrl: updated.youtubeUrl,
      });
      setCoverImage(undefined);
      setRemoveCover(false);
      setStatus("success");
      notifyCampaignsUpdated();
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        adminAuth.markSessionExpired();
      }

      const message = cause instanceof MediaUploadError
        ? cause.code === "INVALID_TYPE"
          ? t("profile.invalidImage")
          : t("media.uploadError")
        : cause instanceof ApiError
          ? cause.status === 404
            ? t("campaign.update.notFound")
            : cause.status === 400 || cause.status === 403
              ? t("campaign.update.invalidData")
              : t("campaign.update.error")
          : t("campaign.update.error");
      setStatus("error");
      setError(message);
    }
  }

  const isSubmitting = status === "uploading-image" || status === "saving";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="update-campaign-title"
      aria-describedby="update-campaign-description"
      onClick={handleBackdropClick}
      className="m-auto max-h-[90vh] w-[min(720px,calc(100%-2rem))] overflow-y-auto rounded-3xl border border-white/15 bg-zinc-950 p-0 text-zinc-100 shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm"
    >
      <header className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-white/10 bg-zinc-950/95 px-6 py-5 backdrop-blur sm:px-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">
            {t("campaign.update.eyebrow")}
          </p>
          <h2 id="update-campaign-title" className="mt-2 text-2xl font-semibold">
            {t("campaign.update.title")}
          </h2>
          <p id="update-campaign-description" className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
            {t("campaign.update.description")}
          </p>
        </div>
        <button
          type="button"
          onClick={closeModal}
          aria-label={t("campaign.update.close")}
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 text-xl text-zinc-400 transition hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60"
        >
          ×
        </button>
      </header>

      <form onSubmit={handleSubmit} className="space-y-7 px-6 py-6 sm:px-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-zinc-300">
            <span>{t("campaign.create.titleLabel")}</span>
            <input
              name="title"
              type="text"
              required
              minLength={5}
              maxLength={80}
              value={fields.title}
              onChange={(event) => updateField("title", event.target.value)}
              className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 text-white outline-none transition focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
            />
          </label>

          <label className="space-y-2 text-sm text-zinc-300">
            <span>{t("campaign.create.category")}</span>
            <select
              name="category"
              value={fields.category}
              onChange={(event) => updateField(
                "category",
                event.target.value as CampaignCategory,
              )}
              className="h-11 w-full rounded-xl border border-white/15 bg-zinc-900 px-4 text-white outline-none transition focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
            >
              <option value="education">{t("campaign.category.education")}</option>
              <option value="entertainment">{t("campaign.category.entertainment")}</option>
              <option value="science">{t("campaign.category.science")}</option>
              <option value="games">{t("campaign.category.games")}</option>
              <option value="other">{t("campaign.category.other")}</option>
            </select>
          </label>
        </div>

        <label className="block space-y-2 text-sm text-zinc-300">
          <span>{t("campaign.create.descriptionLabel")}</span>
          <textarea
            name="description"
            required
            minLength={20}
            maxLength={500}
            rows={5}
            value={fields.description}
            onChange={(event) => updateField("description", event.target.value)}
            className="w-full resize-y rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 leading-6 text-white outline-none transition focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
          />
        </label>

        <label className="block space-y-2 text-sm text-zinc-300">
          <span>{t("campaign.create.youtube")}</span>
          <input
            name="youtubeUrl"
            type="url"
            required
            value={fields.youtubeUrl}
            onChange={(event) => updateField("youtubeUrl", event.target.value)}
            className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 text-white outline-none transition focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
          />
        </label>

        <fieldset className="rounded-2xl border border-white/10 p-4">
          <legend className="px-2 text-sm text-zinc-300">{t("campaign.create.cover")}</legend>
          <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center">
            <div className="relative grid h-28 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] place-items-center">
              {displayedCoverUrl ? (
                <Image
                  src={displayedCoverUrl}
                  alt={t("common.campaignCover", { title: fields.title })}
                  fill
                  sizes="160px"
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <span className="px-3 text-center text-xs text-zinc-500">
                  {t("campaign.noCover")}
                </span>
              )}
            </div>

            <div>
              <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.04] px-4 py-3 text-sm text-zinc-300 transition hover:border-emerald-300/40 hover:text-white">
                {coverImage ? coverImage.name : t("campaign.update.selectCover")}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) selectCoverImage(file);
                    event.target.value = "";
                  }}
                />
              </label>
              <div className="mt-3 flex flex-wrap gap-4 text-xs">
                {coverImage && (
                  <button type="button" onClick={() => {
                    setCoverImage(undefined);
                    setStatus("idle");
                    setError(undefined);
                  }} className="text-zinc-400 transition hover:text-white">
                    {t("campaign.update.cancelCover")}
                  </button>
                )}
                {!coverImage && campaign?.imageObjectKey && (
                  <button type="button" onClick={() => {
                    setRemoveCover((current) => !current);
                    setStatus("idle");
                    setError(undefined);
                  }} className="text-zinc-400 transition hover:text-white">
                    {removeCover ? t("campaign.update.keepCover") : t("campaign.update.removeCover")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </fieldset>

        <div aria-live="polite" className="min-h-6 text-sm">
          {status === "success" && <p className="text-emerald-200">{t("campaign.update.success")}</p>}
          {status === "info" && <p className="text-zinc-400">{t("campaign.update.noChanges")}</p>}
          {status === "error" && <p role="alert" className="text-red-300">{error}</p>}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
          <button type="button" onClick={closeModal} className="rounded-xl px-5 py-3 text-sm font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white">
            {t("common.cancel")}
          </button>
          <button type="submit" disabled={isSubmitting} className="rounded-xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60">
            {status === "uploading-image"
              ? t("campaign.create.uploadingImage")
              : status === "saving"
                ? t("campaign.update.saving")
                : t("campaign.update.save")}
          </button>
        </div>
      </form>
    </dialog>
  );
}
