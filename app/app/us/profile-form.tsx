"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { updateProfile, uploadProfileImage, removeProfileImage } from "./actions";
import { isProfileImageUrl } from "./profile-image";

const ALLOWED_AVATARS = ["❤️", "🧡", "💛", "💚", "💙", "💜", "🤍", "🖤", "💖", "💘"] as const;
const MAX_SIZE_MB = 2;
const ACCEPT = "image/jpeg,image/png";

type Props = {
  currentName: string;
  currentAvatar: string;
};

export function ProfileForm({ currentName, currentAvatar }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasCustomImage = isProfileImageUrl(currentAvatar);
  const normalizedAvatar =
    !hasCustomImage && typeof currentAvatar === "string" && (ALLOWED_AVATARS as readonly string[]).includes(currentAvatar)
      ? currentAvatar
      : ALLOWED_AVATARS[0];
  const [selectedAvatar, setSelectedAvatar] = useState(normalizedAvatar);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setUploadError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    if (!hasCustomImage) formData.set("avatar", selectedAvatar);
    try {
      await updateProfile(formData);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPT.split(",").some((t) => file.type === t.trim())) {
      setUploadError("Please choose a JPG or PNG image.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadError(`Image must be ${MAX_SIZE_MB}MB or smaller.`);
      return;
    }
    setUploadError(null);
    setUploadSuccess(false);
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadProfileImage(formData);
    setUploading(false);
    if (result.ok) {
      setUploadedPreviewUrl(result.url);
      setUploadSuccess(true);
      router.refresh();
      setTimeout(() => {
        setUploadSuccess(false);
        setUploadedPreviewUrl(null);
      }, 4000);
    } else setUploadError(result.error);
  }

  async function handleRemovePhoto() {
    setUploadError(null);
    setUploading(true);
    const result = await removeProfileImage();
    setUploading(false);
    if (result.ok) {
      setSelectedAvatar(ALLOWED_AVATARS[0]);
      router.refresh();
    } else setUploadError(result.error);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="name"
          className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-[11px]"
        >
          Name
        </label>
        <input
          id="name"
          name="name"
          defaultValue={currentName}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300 sm:text-lg"
          placeholder="Your display name"
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-[11px]">
          Photo
        </p>
        {hasCustomImage ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-2 ring-pink-200">
              <Image
                src={currentAvatar}
                alt="Your photo"
                fill
                className="object-cover"
                sizes="64px"
                unoptimized={currentAvatar.includes("blob.vercel-storage.com")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-sm font-medium text-pink-600 hover:text-pink-700 disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "Change photo"}
              </button>
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={uploading}
                className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50"
              >
                Remove photo
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {ALLOWED_AVATARS.map((icon) => (
                <label
                  key={icon}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    selectedAvatar === icon
                      ? "border-pink-300 bg-pink-50 text-pink-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-pink-100"
                  }`}
                >
                  <input
                    type="radio"
                    name="avatar"
                    value={icon}
                    checked={selectedAvatar === icon}
                    onChange={() => setSelectedAvatar(icon)}
                    className="sr-only"
                  />
                  <span className="text-base">{icon}</span>
                </label>
              ))}
            </div>
            <div className="space-y-1">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="ns-btn-secondary !text-sm"
              >
                {uploading ? "Uploading…" : "Upload your image"}
              </button>
              <p className="text-xs text-slate-500">JPG or PNG, max {MAX_SIZE_MB}MB</p>
            </div>
          </>
        )}
        {uploadSuccess && (
          <div className="flex flex-wrap items-center gap-3">
            {uploadedPreviewUrl && (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-2 ring-emerald-300">
                <Image
                  src={uploadedPreviewUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                  unoptimized={uploadedPreviewUrl.includes("blob.vercel-storage.com")}
                />
              </div>
            )}
            <p className="text-sm font-medium text-emerald-600" role="status">
              Photo updated.
            </p>
          </div>
        )}
        {uploadError && (
          <p className="text-sm text-red-600" role="alert">
            {uploadError}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="ns-btn-primary mt-2 !text-sm"
      >
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
