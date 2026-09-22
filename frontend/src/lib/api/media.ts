import { apiRequest } from "./client";

export async function uploadCampaignImage(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Escolha uma imagem JPG, PNG ou WebP.");
  }

  const signedUpload = await apiRequest<{
    uploadUrl: string;
    objectKey: string;
    contentType: string;
  }>("/uploads/media", {
    method: "POST",
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      purpose: "campaign-image",
    }),
  });

  // The API signs the PUT; the file itself goes directly from the browser to S3.
  const uploadResponse = await fetch(signedUpload.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": signedUpload.contentType },
    body: file,
    signal: AbortSignal.timeout(60_000),
  });
  if (!uploadResponse.ok) {
    throw new Error("O envio da imagem ao S3 falhou. Verifique a configuração do bucket e tente novamente.");
  }

  return signedUpload.objectKey;
}

export function getCampaignImageUrl(objectKey: string): Promise<{ mediaUrl: string; expiresAt: string }> {
  return apiRequest(
    `/uploads/media?objectKey=${encodeURIComponent(objectKey)}`,
  );
}
