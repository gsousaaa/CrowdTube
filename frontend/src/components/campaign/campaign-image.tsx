"use client";

import Image from "next/image";

import { useMediaUrl } from "@/hooks/use-media-url";

export function CampaignImage({ objectKey, alt }: { objectKey: string | null; alt: string }) {
  const { url } = useMediaUrl(objectKey);

  if (!url) {
    return <span className="text-xs text-zinc-400">{objectKey ? "Carregando imagem..." : "Sem imagem de capa"}</span>;
  }

  return <Image src={url} alt={alt} fill sizes="(max-width: 1024px) 100vw, 300px" unoptimized className="object-cover" />;
}
