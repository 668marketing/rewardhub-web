"use client";

import { useEffect, useState } from "react";
import MerchantNav from "@/components/layout/MerchantNav";
import {
  getMerchantGallery,
  uploadMerchantGallery,
  updateMerchantGallery,
  deleteMerchantGallery,
} from "@/lib/api";

export default function MerchantGalleryPage() {
  const [merchantId, setMerchantId] = useState("");
  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);

  const [editingId, setEditingId] = useState("");
  const [editingTitle, setEditingTitle] = useState("");
  const [editingOrder, setEditingOrder] = useState("");
  const [savingId, setSavingId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    const stored = JSON.parse(
      localStorage.getItem("merchant") || "{}"
    );

    const id =
      stored?.merchantId ||
      stored?.MERCHANT_ID ||
      "";

    setMerchantId(id);

    if (!id) {
      setLoading(false);
      return;
    }

    loadGallery(id);
  }, []);

  useEffect(() => {
    return () => {
      if (preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  async function loadGallery(id = merchantId) {
    if (!id) return;

    try {
      setLoading(true);

      const res = await getMerchantGallery(id);

      const data =
        res?.data?.data ||
        res?.data ||
        res?.result ||
        res;

      setGallery(
        Array.isArray(data?.gallery)
          ? data.gallery
          : []
      );
    } catch (error) {
      console.error("Failed to load gallery:", error);
      setGallery([]);
    } finally {
      setLoading(false);
    }
  }

  function fileToBase64(
    selectedFile: File
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = String(reader.result || "");

        resolve(
          result.includes(",")
            ? result.split(",")[1]
            : result
        );
      };

      reader.onerror = () => {
        reject(new Error("Unable to read image"));
      };

      reader.readAsDataURL(selectedFile);
    });
  }

  async function handleUpload() {
    if (!merchantId) {
      alert("Merchant ID missing");
      return;
    }

    if (!file) {
      alert("Please choose an image");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alert("Image must be smaller than 3MB");
      return;
    }

    try {
      setUploading(true);

      const base64 = await fileToBase64(file);

      await uploadMerchantGallery({
        merchantId,
        title: title.trim(),
        fileName: file.name,
        mimeType: file.type || "image/jpeg",
        base64,
      });

      setFile(null);
      setPreview("");
      setTitle("");

      await loadGallery();
      alert("Gallery photo uploaded successfully");
    } catch (error: any) {
      alert(
        error?.message ||
          "Gallery upload failed"
      );
    } finally {
      setUploading(false);
    }
  }

  function startEdit(item: any) {
    setEditingId(item.galleryId);
    setEditingTitle(item.title || "");
    setEditingOrder(
      String(item.sortOrder || "")
    );
  }

  function cancelEdit() {
    setEditingId("");
    setEditingTitle("");
    setEditingOrder("");
  }

  async function saveEdit(item: any) {
    try {
      setSavingId(item.galleryId);

      await updateMerchantGallery({
        merchantId,
        galleryId: item.galleryId,
        title: editingTitle.trim(),
        sortOrder: Number(editingOrder || 0),
      });

      cancelEdit();
      await loadGallery();
    } catch (error: any) {
      alert(
        error?.message ||
          "Failed to update gallery photo"
      );
    } finally {
      setSavingId("");
    }
  }

  async function removePhoto(item: any) {
    const confirmed = window.confirm(
      "Remove this gallery photo?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(item.galleryId);

      await deleteMerchantGallery({
        merchantId,
        galleryId: item.galleryId,
      });

      setGallery((current) =>
        current.filter(
          (photo) =>
            photo.galleryId !== item.galleryId
        )
      );
    } catch (error: any) {
      alert(
        error?.message ||
          "Failed to delete gallery photo"
      );
    } finally {
      setDeletingId("");
    }
  }

  return (
    <>
      <MerchantNav />

      <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl sm:rounded-[2rem] sm:p-7 md:rounded-[2.5rem] md:p-10">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 sm:text-xs sm:tracking-[0.25em]">
              Merchant Gallery
            </p>

            <h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">
              Store Photos
            </h1>

            <p className="mt-2 max-w-2xl text-[11px] font-bold leading-5 text-slate-400 sm:mt-3 sm:text-sm sm:leading-6">
              Upload photos that will appear on your
              public merchant page.
            </p>

            <div className="mt-6 rounded-[1.5rem] bg-white/10 p-4 sm:mt-8 sm:rounded-[2rem] sm:p-6">
              <p className="text-[10px] font-black text-slate-300 sm:text-sm">
                Active Photos
              </p>

              <p className="mt-2 text-3xl font-black sm:text-4xl">
                {gallery.length} / 20
              </p>
            </div>
          </div>

          <section className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-6 lg:rounded-[2.5rem] lg:p-7">
            <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
              Upload New Photo
            </h2>

            <p className="mt-1 text-[11px] font-bold text-slate-500 sm:mt-2 sm:text-sm">
              PNG, JPG or WebP. Maximum size 3MB.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="overflow-hidden rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 sm:rounded-[2rem]">
                {preview ? (
                  <img
                    src={preview}
                    alt="Gallery preview"
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center text-sm font-black text-slate-300">
                    PHOTO PREVIEW
                  </div>
                )}
              </div>

              <div className="rounded-[1.5rem] bg-slate-50 p-4 sm:rounded-[2rem] sm:p-5">
                <label className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 sm:text-xs">
                  Photo Title
                </label>

                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black outline-none focus:border-slate-950"
                  placeholder="Example: Store Front"
                />

                <label className="mt-5 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 sm:text-xs">
                  Choose Image
                </label>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const selectedFile =
                      event.target.files?.[0] || null;

                    if (
                      selectedFile &&
                      selectedFile.size >
                        3 * 1024 * 1024
                    ) {
                      alert(
                        "Image must be smaller than 3MB"
                      );
                      event.target.value = "";
                      return;
                    }

                    setFile(selectedFile);

                    if (selectedFile) {
                      setPreview(
                        URL.createObjectURL(
                          selectedFile
                        )
                      );
                    } else {
                      setPreview("");
                    }
                  }}
                  className="mt-3 block w-full text-xs font-bold text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-950 file:px-4 file:py-3 file:text-xs file:font-black file:text-white"
                />

                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={
                    !file ||
                    uploading ||
                    gallery.length >= 20
                  }
                  className="mt-5 w-full rounded-xl bg-slate-950 py-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40 sm:rounded-2xl sm:py-4 sm:text-sm"
                >
                  {uploading
                    ? "Uploading Photo..."
                    : gallery.length >= 20
                      ? "Maximum 20 Photos"
                      : "Upload Photo"}
                </button>
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-6 lg:rounded-[2.5rem] lg:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                  Gallery Photos
                </h2>

                <p className="mt-1 text-[11px] font-bold text-slate-500 sm:mt-2 sm:text-sm">
                  Edit titles, change order or remove photos.
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadGallery()}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-700 sm:rounded-2xl sm:px-5 sm:py-3 sm:text-sm"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="overflow-hidden rounded-[1.5rem] bg-slate-50"
                  >
                    <div className="aspect-square animate-pulse bg-slate-200 sm:aspect-[4/3]" />
                  </div>
                ))}
              </div>
            ) : gallery.length > 0 ? (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-3">
                {gallery.map((item) => {
                  const isEditing =
                    editingId === item.galleryId;

                  return (
                    <article
                      key={item.galleryId}
                      className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-slate-50 shadow-sm sm:rounded-[2rem]"
                    >
                      <img
                        src={getDisplayImageUrl(
                          item.imageUrl
                        )}
                        alt={
                          item.title ||
                          "Merchant gallery"
                        }
                        className="aspect-square w-full object-cover sm:aspect-[4/3]"
                      />

                      <div className="p-3 sm:p-5">
                        {isEditing ? (
                          <>
                            <label className="text-[9px] font-black uppercase text-slate-400 sm:text-xs">
                              Title
                            </label>

                            <input
                              value={editingTitle}
                              onChange={(event) =>
                                setEditingTitle(
                                  event.target.value
                                )
                              }
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black outline-none"
                            />

                            <label className="mt-3 block text-[9px] font-black uppercase text-slate-400 sm:text-xs">
                              Sort Order
                            </label>

                            <input
                              type="number"
                              min="1"
                              value={editingOrder}
                              onChange={(event) =>
                                setEditingOrder(
                                  event.target.value
                                )
                              }
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black outline-none"
                            />

                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  saveEdit(item)
                                }
                                disabled={
                                  savingId ===
                                  item.galleryId
                                }
                                className="rounded-xl bg-slate-950 px-3 py-2.5 text-[10px] font-black text-white disabled:opacity-40 sm:text-xs"
                              >
                                {savingId ===
                                item.galleryId
                                  ? "Saving..."
                                  : "Save"}
                              </button>

                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="rounded-xl bg-white px-3 py-2.5 text-[10px] font-black text-slate-700 sm:text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-black text-slate-950 sm:text-lg">
                              {item.title ||
                                "Untitled Photo"}
                            </h3>

                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  startEdit(item)
                                }
                                className="rounded-xl bg-slate-950 px-3 py-2.5 text-[10px] font-black text-white sm:text-xs"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  removePhoto(item)
                                }
                                disabled={
                                  deletingId ===
                                  item.galleryId
                                }
                                className="rounded-xl bg-red-50 px-3 py-2.5 text-[10px] font-black text-red-600 disabled:opacity-40 sm:text-xs"
                              >
                                {deletingId ===
                                item.galleryId
                                  ? "Removing..."
                                  : "Remove"}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5 rounded-[1.5rem] bg-slate-50 p-8 text-center sm:mt-6 sm:rounded-[2rem] sm:p-10">
                <p className="text-3xl">📷</p>

                <h3 className="mt-3 text-xl font-black text-slate-950">
                  No gallery photos yet
                </h3>

                <p className="mt-2 text-xs font-bold text-slate-500 sm:text-sm">
                  Upload your first store photo above.
                </p>
              </div>
            )}
          </section>
        </section>
      </main>
    </>
  );
}

function getDriveFileId(url: string) {
  if (!url) return "";

  const idFromQuery = url.match(
    /[?&]id=([^&]+)/
  );

  if (idFromQuery?.[1]) {
    return idFromQuery[1];
  }

  const idFromPath = url.match(
    /\/d\/([^/]+)/
  );

  if (idFromPath?.[1]) {
    return idFromPath[1];
  }

  return "";
}

function getDisplayImageUrl(url: string) {
  if (!url) return "";

  if (!url.includes("drive.google.com")) {
    return url;
  }

  if (url.includes("drive.google.com/thumbnail")) {
    return url;
  }

  const fileId = getDriveFileId(url);

  if (!fileId) {
    return url;
  }

  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(
    fileId
  )}&sz=w1600`;
}