"use client";

import { FormEvent, MouseEvent, useRef, useState } from "react";
import {
  parseEventLogs,
  prepareContractCall,
  prepareEvent,
  waitForReceipt,
} from "thirdweb";
import {
  useActiveAccount,
  useActiveWalletChain,
  useSendTransaction,
} from "thirdweb/react";
import { toWei } from "thirdweb/utils";

import { useAdminWalletAuth } from "@/components/wallet/admin-wallet-auth-provider";
import { type Translate, useLanguage } from "@/i18n/language-provider";
import { createCampaignDraft, recordCampaignCreationTransaction, type CampaignCategory } from "@/lib/api/campaigns";
import { ApiError } from "@/lib/api/client";
import { notifyCampaignsUpdated } from "@/lib/api/events";
import { MediaUploadError, uploadCampaignImage } from "@/lib/api/media";
import { crowdTubeCampaignsContract } from "@/lib/web3/crowdtube-campaigns-contract";
import { crowdTubeChain } from "@/lib/web3/network";

const campaignCreatedEvent = prepareEvent({
  signature:
    "event CampaignCreated(uint256 indexed campaignId, address indexed creator, bytes32 indexed metadataId, uint256 goal, uint256 deadline)",
});

type CreationStatus =
  | "idle"
  | "uploading-image"
  | "saving-draft"
  | "awaiting-signature"
  | "sent"
  | "confirmed"
  | "error";

function parseDeadline(input: string, t: Translate) {
  if (!input) return 0n;

  const deadline = new Date(`${input}T23:59:59`);

  if (Number.isNaN(deadline.getTime()) || deadline.getTime() <= Date.now()) {
    throw new Error(t("campaign.create.invalidDeadline"));
  }

  return BigInt(Math.floor(deadline.getTime() / 1_000));
}

export function CreateCampaignModal() {
  const { t } = useLanguage();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [creationStatus, setCreationStatus] = useState<CreationStatus>("idle");
  const [error, setError] = useState<string>();
  const [createdCampaignId, setCreatedCampaignId] = useState<string>();
  const [transactionHash, setTransactionHash] = useState<string>();
  const [registrationWarning, setRegistrationWarning] = useState<string>();
  const account = useActiveAccount();
  const adminAuth = useAdminWalletAuth();
  const activeChain = useActiveWalletChain();
  const sendTransaction = useSendTransaction({ payModal: false });

  function openModal() {
    setCreationStatus("idle");
    setError(undefined);
    setCreatedCampaignId(undefined);
    setTransactionHash(undefined);
    setRegistrationWarning(undefined);
    dialogRef.current?.showModal();
  }

  function closeModal() {
    dialogRef.current?.close();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setCreatedCampaignId(undefined);
    setTransactionHash(undefined);
    setRegistrationWarning(undefined);

    const form = event.currentTarget;
    let draftId: string | undefined;
    let submittedHash: string | undefined;

    try {
      if (!account) {
        throw new Error(t("campaign.create.connectWallet"));
      }
      if (adminAuth.status !== "ready") {
        throw new Error(t("campaign.create.authenticateWallet"));
      }
      if (activeChain?.id !== crowdTubeChain.id) {
        throw new Error(t("campaign.create.selectNetwork", {
          network: crowdTubeChain.name ?? crowdTubeChain.id,
        }));
      }

      const formData = new FormData(form);
      const goalEth = String(formData.get("goal") ?? "");
      const deadlineInput = String(formData.get("deadline") ?? "");
      const goal = toWei(goalEth);
      const deadline = parseDeadline(deadlineInput, t);

      if (goal <= 0n) {
        throw new Error(t("campaign.create.invalidGoal"));
      }

      const coverImage = formData.get("coverImage");
      let imageObjectKey: string | null = null;
      if (coverImage instanceof File && coverImage.size > 0) {
        setCreationStatus("uploading-image");
        imageObjectKey = await uploadCampaignImage(coverImage);
      }

      setCreationStatus("saving-draft");
      const draft = await createCampaignDraft({
        title: String(formData.get("title") ?? ""),
        category: String(formData.get("category") ?? "") as CampaignCategory,
        description: String(formData.get("description") ?? ""),
        youtubeUrl: String(formData.get("youtubeUrl") ?? ""),
        imageObjectKey,
      });
      draftId = draft.id;
      notifyCampaignsUpdated();

      const transaction = prepareContractCall({
        contract: crowdTubeCampaignsContract,
        method: "createCampaign",
        params: [draft.metadataId, goal, deadline],
      });

      setCreationStatus("awaiting-signature");
      const sentTransaction = await sendTransaction.mutateAsync(transaction);
      submittedHash = sentTransaction.transactionHash;
      setTransactionHash(submittedHash);
      setCreationStatus("sent");

      try {
        await recordCampaignCreationTransaction(draft.id, {
          chainId: crowdTubeChain.id,
          contractAddress: crowdTubeCampaignsContract.address,
          transactionHash: submittedHash,
        });
      } catch {
        // The indexer can still associate a draft by metadataId. Never ask the
        // user to send a second transaction merely because this API call failed.
        setRegistrationWarning(t("campaign.create.registrationWarning"));
      }
      notifyCampaignsUpdated();

      const receipt = await waitForReceipt(sentTransaction);
      const [createdEvent] = parseEventLogs({
        events: [campaignCreatedEvent],
        logs: receipt.logs,
      });

      if (!createdEvent) {
        throw new Error(t("campaign.create.eventMissing"));
      }
      if (createdEvent.args.metadataId.toLowerCase() !== draft.metadataId.toLowerCase()) {
        throw new Error(t("campaign.create.eventMismatch"));
      }

      setCreatedCampaignId(draft.id);
      setCreationStatus("confirmed");
      notifyCampaignsUpdated();
      form.reset();
    } catch (creationError) {
      if (creationError instanceof ApiError && creationError.status === 401) {
        adminAuth.markSessionExpired();
      }
      setCreationStatus("error");
      const message = creationError instanceof MediaUploadError
        ? creationError.code === "INVALID_TYPE"
          ? t("profile.invalidImage")
          : t("media.uploadError")
        : creationError instanceof Error
          ? creationError.message
          : t("campaign.create.error");
      setError(submittedHash
        ? t("campaign.create.sentTrackingError", { hash: submittedHash, message })
        : draftId
          ? t("campaign.create.draftError", { id: draftId, message })
          : message);
      notifyCampaignsUpdated();
    }
  }

  const isProcessing =
    creationStatus === "uploading-image" ||
    creationStatus === "saving-draft" ||
    creationStatus === "awaiting-signature" ||
    creationStatus === "sent";

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="rounded-xl border border-white/15 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60"
      >
        {t("campaign.create.action")}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="create-campaign-title"
        aria-describedby="create-campaign-description"
        onClick={handleBackdropClick}
        onClose={() => setCreationStatus("idle")}
        className="m-auto max-h-[90vh] w-[min(720px,calc(100%-2rem))] overflow-y-auto rounded-3xl border border-white/15 bg-zinc-950 p-0 text-zinc-100 shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-white/10 bg-zinc-950/95 px-6 py-5 backdrop-blur sm:px-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">
              {t("campaign.create.new")}
            </p>
            <h2 id="create-campaign-title" className="mt-2 text-2xl font-semibold">
              {t("campaign.create.title")}
            </h2>
            <p
              id="create-campaign-description"
              className="mt-2 max-w-xl text-sm leading-6 text-zinc-400"
            >
              {t("campaign.create.description")}
            </p>
          </div>

          <button
            type="button"
            onClick={closeModal}
            aria-label={t("campaign.create.close")}
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 text-zinc-400 transition hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ×
            </span>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          onInput={() => {
            setError(undefined);
            if (creationStatus === "error") setCreationStatus("idle");
          }}
          className="space-y-8 px-6 py-6 sm:px-8"
        >
          <fieldset>
            <legend className="text-base font-semibold text-white">
              {t("campaign.create.presentation")}
            </legend>
            <p className="mt-1 text-sm text-zinc-500">
              {t("campaign.create.offchainDescription")}
            </p>

            <div className="mt-5 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-zinc-300">
                <span>{t("campaign.create.titleLabel")}</span>
                <input
                  name="title"
                  type="text"
                  required
                  minLength={5}
                  maxLength={80}
                  placeholder={t("campaign.create.titlePlaceholder")}
                  className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
                />
              </label>

              <label className="space-y-2 text-sm text-zinc-300">
                <span>{t("campaign.create.category")}</span>
                <select
                  name="category"
                  required
                  defaultValue=""
                  className="h-11 w-full rounded-xl border border-white/15 bg-zinc-900 px-4 text-white outline-none transition focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
                >
                  <option value="" disabled>
                    {t("campaign.create.selectCategory")}
                  </option>
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
                placeholder={t("campaign.create.descriptionPlaceholder")}
                className="w-full resize-y rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 leading-6 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
              />
              </label>

              <label className="block space-y-2 text-sm text-zinc-300">
              <span>{t("campaign.create.youtube")}</span>
              <input
                name="youtubeUrl"
                type="url"
                required
                placeholder="https://youtube.com/..."
                className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
              />
              </label>

              <fieldset className="space-y-4 rounded-2xl border border-white/10 p-4">
                <legend className="px-2 text-sm text-zinc-300">{t("campaign.create.cover")}</legend>
                <p className="text-xs text-zinc-500">{t("campaign.create.linkUnsupported")}</p>
                <label className="block space-y-2 text-sm text-zinc-300">
                  <span>{t("campaign.create.selectImage")}</span>
                  <input
                    name="coverImage"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="block w-full cursor-pointer rounded-xl border border-dashed border-white/20 bg-white/[0.04] p-3 text-sm text-zinc-400 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-300 file:px-4 file:py-2 file:font-medium file:text-zinc-950 hover:border-emerald-300/40"
                  />
                  <span className="block text-xs leading-5 text-zinc-500">
                    {t("campaign.create.imageHelp")}
                  </span>
                </label>
              </fieldset>
            </div>
          </fieldset>

          <fieldset className="border-t border-white/10">
            <legend className="pr-3 text-base font-semibold text-white">
              {t("campaign.create.goalSection")}
            </legend>
            <p className="mt-1 text-sm text-zinc-500">
              {t("campaign.create.goalDescription")}
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-zinc-300">
                <span>{t("campaign.create.goalLabel")}</span>
                <input
                  name="goal"
                  type="number"
                  required
                  min="0.001"
                  step="0.001"
                  inputMode="decimal"
                  placeholder="0.500"
                  className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
                />
              </label>

              <label className="space-y-2 text-sm text-zinc-300">
                <span>{t("campaign.create.deadline")}</span>
                <input
                  name="deadline"
                  type="date"
                  className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 text-white outline-none transition focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
                />
                <span className="block text-xs text-zinc-500">
                  {t("campaign.create.deadlineHelp")}
                </span>
              </label>
            </div>
          </fieldset>

          {creationStatus === "confirmed" && createdCampaignId && (
            <div
              role="status"
              className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm leading-6 text-emerald-100"
            >
              {t("campaign.create.confirmed")}
            </div>
          )}

          {registrationWarning && (
            <p role="status" className="text-sm text-amber-200">{registrationWarning}</p>
          )}
          {transactionHash && creationStatus === "sent" && (
            <p className="break-all text-xs text-zinc-400">{t("campaign.create.transactionSent", { hash: transactionHash })}</p>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-red-300/25 bg-red-300/10 px-4 py-3 text-sm leading-6 text-red-100"
            >
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl px-5 py-3 text-sm font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="rounded-xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              {creationStatus === "uploading-image" && t("campaign.create.uploadingImage")}
              {creationStatus === "saving-draft" && t("campaign.create.savingDraft")}
              {creationStatus === "awaiting-signature" && t("wallet.confirmWallet")}
              {creationStatus === "sent" && t("wallet.awaitingConfirmation")}
              {(creationStatus === "idle" ||
                creationStatus === "confirmed" ||
                creationStatus === "error") &&
                t("campaign.create.action")}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
