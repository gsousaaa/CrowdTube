"use client";

import Image from "next/image";

import { useMediaUrl } from "@/hooks/use-media-url";
import { useLanguage } from "@/i18n/language-provider";

export function CampaignImage({ objectKey, alt }: { objectKey: string | null; alt: string }) {
  const { t } = useLanguage();
  const { url } = useMediaUrl(objectKey);

  if (!url) {
    return <span className="text-xs text-zinc-400">{objectKey ? t("campaign.loadingImage") : t("campaign.noCover")}</span>;
  }

  return <Image src={url} alt={alt} fill sizes="(max-width: 1024px) 100vw, 300px" unoptimized className="object-cover" />;
}
