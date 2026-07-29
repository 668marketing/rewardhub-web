"use client";

import { useEffect, useMemo, useState } from "react";
import MerchantNav from "@/components/layout/MerchantNav";
import SmartImage from "@/components/ui/SmartImage";
import {
  getMerchantGallery,
  uploadMerchantGallery,
  updateMerchantGallery,
  deleteMerchantGallery,
} from "@/lib/api";

type LanguageCode = "en" | "zh" | "ms";

type Translation = {
  merchantGallery: string;
  storePhotos: string;
  pageDescription: string;
  activePhotos: string;
  uploadNewPhoto: string;
  uploadRequirements: string;
  galleryPreview: string;
  photoPreview: string;
  photoTitle: string;
  photoTitlePlaceholder: string;
  chooseImage: string;
  uploadingPhoto: string;
  maximumPhotos: string;
  uploadPhoto: string;
  galleryPhotos: string;
  galleryDescription: string;
  refresh: string;
  title: string;
  sortOrder: string;
  saving: string;
  save: string;
  cancel: string;
  untitledPhoto: string;
  edit: string;
  removing: string;
  remove: string;
  noPhotosTitle: string;
  noPhotosDescription: string;
  merchantGalleryAlt: string;
  merchantIdMissing: string;
  chooseImageAlert: string;
  imageTooLarge: string;
  readImageFailed: string;
  uploadSuccess: string;
  uploadFailed: string;
  updateFailed: string;
  removeConfirm: string;
  deleteFailed: string;
};

const LANGUAGE_STORAGE_KEY = "rewardhub-language";

const translations: Record<LanguageCode, Translation> = {
  en: {
    merchantGallery: "Merchant Gallery",
    storePhotos: "Store Photos",
    pageDescription:
      "Upload photos that will appear on your public merchant page.",
    activePhotos: "Active Photos",
    uploadNewPhoto: "Upload New Photo",
    uploadRequirements: "PNG, JPG or WebP. Maximum size 3MB.",
    galleryPreview: "Gallery preview",
    photoPreview: "PHOTO PREVIEW",
    photoTitle: "Photo Title",
    photoTitlePlaceholder: "Example: Store Front",
    chooseImage: "Choose Image",
    uploadingPhoto: "Uploading Photo...",
    maximumPhotos: "Maximum 20 Photos",
    uploadPhoto: "Upload Photo",
    galleryPhotos: "Gallery Photos",
    galleryDescription: "Edit titles, change order or remove photos.",
    refresh: "Refresh",
    title: "Title",
    sortOrder: "Sort Order",
    saving: "Saving...",
    save: "Save",
    cancel: "Cancel",
    untitledPhoto: "Untitled Photo",
    edit: "Edit",
    removing: "Removing...",
    remove: "Remove",
    noPhotosTitle: "No gallery photos yet",
    noPhotosDescription: "Upload your first store photo above.",
    merchantGalleryAlt: "Merchant gallery",
    merchantIdMissing: "Merchant ID missing",
    chooseImageAlert: "Please choose an image",
    imageTooLarge: "Image must be smaller than 3MB",
    readImageFailed: "Unable to read image",
    uploadSuccess: "Gallery photo uploaded successfully",
    uploadFailed: "Gallery upload failed",
    updateFailed: "Failed to update gallery photo",
    removeConfirm: "Remove this gallery photo?",
    deleteFailed: "Failed to delete gallery photo",
  },
  zh: {
    merchantGallery: "商家相册",
    storePhotos: "店铺照片",
    pageDescription: "上传将在公开商家页面显示的店铺照片。",
    activePhotos: "当前照片",
    uploadNewPhoto: "上传新照片",
    uploadRequirements: "支持 PNG、JPG 或 WebP，最大文件大小为 3MB。",
    galleryPreview: "相册预览",
    photoPreview: "照片预览",
    photoTitle: "照片标题",
    photoTitlePlaceholder: "例如：店铺门面",
    chooseImage: "选择图片",
    uploadingPhoto: "正在上传照片……",
    maximumPhotos: "最多上传 20 张照片",
    uploadPhoto: "上传照片",
    galleryPhotos: "相册照片",
    galleryDescription: "编辑标题、调整顺序或删除照片。",
    refresh: "刷新",
    title: "标题",
    sortOrder: "排列顺序",
    saving: "正在保存……",
    save: "保存",
    cancel: "取消",
    untitledPhoto: "未命名照片",
    edit: "编辑",
    removing: "正在删除……",
    remove: "删除",
    noPhotosTitle: "目前还没有相册照片",
    noPhotosDescription: "请在上方上传第一张店铺照片。",
    merchantGalleryAlt: "商家相册",
    merchantIdMissing: "找不到商家 ID",
    chooseImageAlert: "请选择一张图片",
    imageTooLarge: "图片必须小于 3MB",
    readImageFailed: "无法读取图片",
    uploadSuccess: "相册照片上传成功",
    uploadFailed: "相册照片上传失败",
    updateFailed: "更新相册照片失败",
    removeConfirm: "确定要删除这张相册照片吗？",
    deleteFailed: "删除相册照片失败",
  },
  ms: {
    merchantGallery: "Galeri Pedagang",
    storePhotos: "Foto Kedai",
    pageDescription:
      "Muat naik foto yang akan dipaparkan pada halaman awam pedagang anda.",
    activePhotos: "Foto Aktif",
    uploadNewPhoto: "Muat Naik Foto Baharu",
    uploadRequirements: "PNG, JPG atau WebP. Saiz maksimum 3MB.",
    galleryPreview: "Pratonton galeri",
    photoPreview: "PRATONTON FOTO",
    photoTitle: "Tajuk Foto",
    photoTitlePlaceholder: "Contoh: Bahagian Hadapan Kedai",
    chooseImage: "Pilih Imej",
    uploadingPhoto: "Sedang Memuat Naik Foto...",
    maximumPhotos: "Maksimum 20 Foto",
    uploadPhoto: "Muat Naik Foto",
    galleryPhotos: "Foto Galeri",
    galleryDescription: "Edit tajuk, ubah susunan atau padam foto.",
    refresh: "Muat Semula",
    title: "Tajuk",
    sortOrder: "Susunan",
    saving: "Sedang Menyimpan...",
    save: "Simpan",
    cancel: "Batal",
    untitledPhoto: "Foto Tanpa Tajuk",
    edit: "Edit",
    removing: "Sedang Memadam...",
    remove: "Padam",
    noPhotosTitle: "Belum ada foto galeri",
    noPhotosDescription: "Muat naik foto kedai pertama anda di atas.",
    merchantGalleryAlt: "Galeri pedagang",
    merchantIdMissing: "ID pedagang tidak ditemui",
    chooseImageAlert: "Sila pilih satu imej",
    imageTooLarge: "Saiz imej mesti kurang daripada 3MB",
    readImageFailed: "Tidak dapat membaca imej",
    uploadSuccess: "Foto galeri berjaya dimuat naik",
    uploadFailed: "Muat naik galeri gagal",
    updateFailed: "Gagal mengemas kini foto galeri",
    removeConfirm: "Padam foto galeri ini?",
    deleteFailed: "Gagal memadam foto galeri",
  },
};

function normalizeLanguage(value: string | null): LanguageCode {
  if (value === "zh" || value === "ms") return value;
  return "en";
}

export default function MerchantGalleryPage() {
  const [language, setLanguage] = useState<LanguageCode>("en");
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

  const t = useMemo(() => translations[language], [language]);

  useEffect(() => {
    setLanguage(
      normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY))
    );

    function handleLanguageChange(event: Event) {
      const customEvent = event as CustomEvent<{ language?: string }>;
      const eventLanguage = customEvent.detail?.language;
      const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

      setLanguage(normalizeLanguage(eventLanguage || savedLanguage));
    }

    window.addEventListener(
      "rewardhub-language-change",
      handleLanguageChange as EventListener
    );
    window.addEventListener("storage", handleLanguageChange as EventListener);

    return () => {
      window.removeEventListener(
        "rewardhub-language-change",
        handleLanguageChange as EventListener
      );
      window.removeEventListener(
        "storage",
        handleLanguageChange as EventListener
      );
    };
  }, []);

  useEffect(() => {
    let stored: any = {};

    try {
      stored = JSON.parse(localStorage.getItem("merchant") || "{}");
    } catch {
      stored = {};
    }

    const id = stored?.merchantId || stored?.MERCHANT_ID || "";

    setMerchantId(id);

    if (!id) {
      setLoading(false);
      return;
    }

    void loadGallery(id);
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

      const data = res?.data?.data || res?.data || res?.result || res;

      setGallery(Array.isArray(data?.gallery) ? data.gallery : []);
    } catch (error) {
      console.error("Failed to load gallery:", error);
      setGallery([]);
    } finally {
      setLoading(false);
    }
  }

  function fileToBase64(selectedFile: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = String(reader.result || "");

        resolve(result.includes(",") ? result.split(",")[1] : result);
      };

      reader.onerror = () => {
        reject(new Error(t.readImageFailed));
      };

      reader.readAsDataURL(selectedFile);
    });
  }

  async function handleUpload() {
    if (!merchantId) {
      alert(t.merchantIdMissing);
      return;
    }

    if (!file) {
      alert(t.chooseImageAlert);
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alert(t.imageTooLarge);
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

      if (preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }

      setFile(null);
      setPreview("");
      setTitle("");

      await loadGallery();
      alert(t.uploadSuccess);
    } catch (error: any) {
      alert(error?.message || t.uploadFailed);
    } finally {
      setUploading(false);
    }
  }

  function startEdit(item: any) {
    setEditingId(item.galleryId);
    setEditingTitle(item.title || "");
    setEditingOrder(String(item.sortOrder || ""));
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
      alert(error?.message || t.updateFailed);
    } finally {
      setSavingId("");
    }
  }

  async function removePhoto(item: any) {
    const confirmed = window.confirm(t.removeConfirm);

    if (!confirmed) return;

    try {
      setDeletingId(item.galleryId);

      await deleteMerchantGallery({
        merchantId,
        galleryId: item.galleryId,
      });

      setGallery((current) =>
        current.filter((photo) => photo.galleryId !== item.galleryId)
      );
    } catch (error: any) {
      alert(error?.message || t.deleteFailed);
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
              {t.merchantGallery}
            </p>

            <h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">
              {t.storePhotos}
            </h1>

            <p className="mt-2 max-w-2xl text-[11px] font-bold leading-5 text-slate-400 sm:mt-3 sm:text-sm sm:leading-6">
              {t.pageDescription}
            </p>

            <div className="mt-6 rounded-[1.5rem] bg-white/10 p-4 sm:mt-8 sm:rounded-[2rem] sm:p-6">
              <p className="text-[10px] font-black text-slate-300 sm:text-sm">
                {t.activePhotos}
              </p>

              <p className="mt-2 text-3xl font-black sm:text-4xl">
                {gallery.length} / 20
              </p>
            </div>
          </div>

          <section className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-6 lg:rounded-[2.5rem] lg:p-7">
            <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
              {t.uploadNewPhoto}
            </h2>

            <p className="mt-1 text-[11px] font-bold text-slate-500 sm:mt-2 sm:text-sm">
              {t.uploadRequirements}
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="overflow-hidden rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 sm:rounded-[2rem]">
                {preview ? (
                  <img
                    src={preview}
                    alt={t.galleryPreview}
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center text-sm font-black text-slate-300">
                    {t.photoPreview}
                  </div>
                )}
              </div>

              <div className="rounded-[1.5rem] bg-slate-50 p-4 sm:rounded-[2rem] sm:p-5">
                <label className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 sm:text-xs">
                  {t.photoTitle}
                </label>

                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black outline-none focus:border-slate-950"
                  placeholder={t.photoTitlePlaceholder}
                />

                <label className="mt-5 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 sm:text-xs">
                  {t.chooseImage}
                </label>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const selectedFile = event.target.files?.[0] || null;

                    if (
                      selectedFile &&
                      selectedFile.size > 3 * 1024 * 1024
                    ) {
                      alert(t.imageTooLarge);
                      event.target.value = "";
                      return;
                    }

                    if (preview.startsWith("blob:")) {
                      URL.revokeObjectURL(preview);
                    }

                    setFile(selectedFile);

                    if (selectedFile) {
                      setPreview(URL.createObjectURL(selectedFile));
                    } else {
                      setPreview("");
                    }
                  }}
                  className="mt-3 block w-full text-xs font-bold text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-950 file:px-4 file:py-3 file:text-xs file:font-black file:text-white"
                />

                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!file || uploading || gallery.length >= 20}
                  className="mt-5 w-full rounded-xl bg-slate-950 py-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40 sm:rounded-2xl sm:py-4 sm:text-sm"
                >
                  {uploading
                    ? t.uploadingPhoto
                    : gallery.length >= 20
                      ? t.maximumPhotos
                      : t.uploadPhoto}
                </button>
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-6 lg:rounded-[2.5rem] lg:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                  {t.galleryPhotos}
                </h2>

                <p className="mt-1 text-[11px] font-bold text-slate-500 sm:mt-2 sm:text-sm">
                  {t.galleryDescription}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadGallery()}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-700 sm:rounded-2xl sm:px-5 sm:py-3 sm:text-sm"
              >
                {t.refresh}
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
                  const isEditing = editingId === item.galleryId;

                  return (
                    <article
                      key={item.galleryId}
                      className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-slate-50 shadow-sm sm:rounded-[2rem]"
                    >
                      <div className="aspect-square w-full overflow-hidden bg-slate-100 sm:aspect-[4/3]">
                        <SmartImage
                          src={item.imageUrl || item.IMAGE_URL || ""}
                          alt={item.title || t.merchantGalleryAlt}
                          fallbackLabel="🖼️"
                          width={1200}
                          className="h-full w-full object-cover"
                          fallbackClassName="text-4xl"
                        />
                      </div>

                      <div className="p-3 sm:p-5">
                        {isEditing ? (
                          <>
                            <label className="text-[9px] font-black uppercase text-slate-400 sm:text-xs">
                              {t.title}
                            </label>

                            <input
                              value={editingTitle}
                              onChange={(event) =>
                                setEditingTitle(event.target.value)
                              }
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black outline-none"
                            />

                            <label className="mt-3 block text-[9px] font-black uppercase text-slate-400 sm:text-xs">
                              {t.sortOrder}
                            </label>

                            <input
                              type="number"
                              min="1"
                              value={editingOrder}
                              onChange={(event) =>
                                setEditingOrder(event.target.value)
                              }
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black outline-none"
                            />

                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => void saveEdit(item)}
                                disabled={savingId === item.galleryId}
                                className="rounded-xl bg-slate-950 px-3 py-2.5 text-[10px] font-black text-white disabled:opacity-40 sm:text-xs"
                              >
                                {savingId === item.galleryId
                                  ? t.saving
                                  : t.save}
                              </button>

                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="rounded-xl bg-white px-3 py-2.5 text-[10px] font-black text-slate-700 sm:text-xs"
                              >
                                {t.cancel}
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-black text-slate-950 sm:text-lg">
                              {item.title || t.untitledPhoto}
                            </h3>

                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => startEdit(item)}
                                className="rounded-xl bg-slate-950 px-3 py-2.5 text-[10px] font-black text-white sm:text-xs"
                              >
                                {t.edit}
                              </button>

                              <button
                                type="button"
                                onClick={() => void removePhoto(item)}
                                disabled={deletingId === item.galleryId}
                                className="rounded-xl bg-red-50 px-3 py-2.5 text-[10px] font-black text-red-600 disabled:opacity-40 sm:text-xs"
                              >
                                {deletingId === item.galleryId
                                  ? t.removing
                                  : t.remove}
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
                  {t.noPhotosTitle}
                </h3>

                <p className="mt-2 text-xs font-bold text-slate-500 sm:text-sm">
                  {t.noPhotosDescription}
                </p>
              </div>
            )}
          </section>
        </section>
      </main>
    </>
  );
}