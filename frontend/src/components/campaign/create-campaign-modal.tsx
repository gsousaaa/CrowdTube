"use client";

import { FormEvent, MouseEvent, useRef, useState } from "react";

export function CreateCampaignModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [imageSource, setImageSource] = useState<"upload" | "url">("upload");

  function openModal() {
    setIsValidated(false);
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsValidated(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="rounded-xl border border-white/15 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60"
      >
        Criar campanha
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="create-campaign-title"
        aria-describedby="create-campaign-description"
        onClick={handleBackdropClick}
        onClose={() => setIsValidated(false)}
        className="m-auto max-h-[90vh] w-[min(720px,calc(100%-2rem))] overflow-y-auto rounded-3xl border border-white/15 bg-zinc-950 p-0 text-zinc-100 shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-white/10 bg-zinc-950/95 px-6 py-5 backdrop-blur sm:px-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">
              Nova campanha
            </p>
            <h2 id="create-campaign-title" className="mt-2 text-2xl font-semibold">
              Conte sua ideia
            </h2>
            <p
              id="create-campaign-description"
              className="mt-2 max-w-xl text-sm leading-6 text-zinc-400"
            >
              Por enquanto, vamos validar somente os dados do formulário. A
              publicação onchain será conectada ao contrato em uma próxima etapa.
            </p>
          </div>

          <button
            type="button"
            onClick={closeModal}
            aria-label="Fechar modal de criação de campanha"
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 text-zinc-400 transition hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ×
            </span>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          onInput={() => setIsValidated(false)}
          className="space-y-8 px-6 py-6 sm:px-8"
        >
          <fieldset className="space-y-5">
            <legend className="text-base font-semibold text-white">
              Apresentação da campanha
            </legend>
            <p className="text-sm text-zinc-500">
              Estes dados serão armazenados offchain pelo backend.
            </p>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-zinc-300">
                <span>Título</span>
                <input
                  name="title"
                  type="text"
                  required
                  minLength={5}
                  maxLength={80}
                  placeholder="Ex.: Nova temporada do canal"
                  className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
                />
              </label>

              <label className="space-y-2 text-sm text-zinc-300">
                <span>Categoria</span>
                <select
                  name="category"
                  required
                  defaultValue=""
                  className="h-11 w-full rounded-xl border border-white/15 bg-zinc-900 px-4 text-white outline-none transition focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
                >
                  <option value="" disabled>
                    Selecione uma categoria
                  </option>
                  <option value="education">Educação</option>
                  <option value="entertainment">Entretenimento</option>
                  <option value="science">Ciência e tecnologia</option>
                  <option value="games">Games</option>
                  <option value="other">Outra</option>
                </select>
              </label>
            </div>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span>Descrição</span>
              <textarea
                name="description"
                required
                minLength={20}
                maxLength={500}
                rows={5}
                placeholder="Explique o objetivo da campanha e como as doações serão utilizadas."
                className="w-full resize-y rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 leading-6 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
              />
            </label>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span>Link do conteúdo no YouTube</span>
              <input
                name="youtubeUrl"
                type="url"
                required
                placeholder="https://youtube.com/..."
                className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
              />
            </label>

            <fieldset className="space-y-4 rounded-2xl border border-white/10 p-4">
              <legend className="px-2 text-sm text-zinc-300">Imagem de capa</legend>

              <div className="grid grid-cols-2 gap-2 rounded-xl bg-white/[0.04] p-1">
                <label
                  className={`cursor-pointer rounded-lg px-4 py-2 text-center text-sm font-medium transition ${
                    imageSource === "upload"
                      ? "bg-emerald-300 text-zinc-950"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="imageSource"
                    value="upload"
                    checked={imageSource === "upload"}
                    onChange={() => setImageSource("upload")}
                    className="sr-only"
                  />
                  Enviar arquivo
                </label>

                <label
                  className={`cursor-pointer rounded-lg px-4 py-2 text-center text-sm font-medium transition ${
                    imageSource === "url"
                      ? "bg-emerald-300 text-zinc-950"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="imageSource"
                    value="url"
                    checked={imageSource === "url"}
                    onChange={() => setImageSource("url")}
                    className="sr-only"
                  />
                  Usar link
                </label>
              </div>

              {imageSource === "upload" ? (
                <label className="block space-y-2 text-sm text-zinc-300">
                  <span>Selecione uma imagem</span>
                  <input
                    name="coverImage"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    required
                    className="block w-full cursor-pointer rounded-xl border border-dashed border-white/20 bg-white/[0.04] p-3 text-sm text-zinc-400 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-300 file:px-4 file:py-2 file:font-medium file:text-zinc-950 hover:border-emerald-300/40"
                  />
                  <span className="block text-xs leading-5 text-zinc-500">
                    JPG, PNG ou WebP. O backend validará o arquivo e fará o upload
                    para o bucket S3.
                  </span>
                </label>
              ) : (
                <label className="block space-y-2 text-sm text-zinc-300">
                  <span>URL pública da imagem</span>
                  <input
                    name="coverImageUrl"
                    type="url"
                    required
                    placeholder="https://exemplo.com/capa.webp"
                    className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
                  />
                  <span className="block text-xs leading-5 text-zinc-500">
                    O backend deverá baixar, validar e armazenar uma cópia no S3.
                  </span>
                </label>
              )}
            </fieldset>
          </fieldset>

          <fieldset className="space-y-5 border-t border-white/10 pt-7">
            <legend className="pr-3 text-base font-semibold text-white">
              Meta da campanha
            </legend>
            <p className="text-sm text-zinc-500">
              A meta será convertida corretamente antes de ser enviada ao contrato.
            </p>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-zinc-300">
                <span>Meta em ETH</span>
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
                <span>Data de encerramento</span>
                <input
                  name="deadline"
                  type="date"
                  required
                  className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 text-white outline-none transition focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
                />
              </label>
            </div>
          </fieldset>

          {isValidated && (
            <div
              role="status"
              className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm leading-6 text-emerald-100"
            >
              Os campos estão válidos. Nenhuma campanha foi salva ou enviada à
              blockchain nesta etapa do protótipo.
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl px-5 py-3 text-sm font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              Validar dados
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
