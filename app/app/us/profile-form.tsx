"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "./actions";

const ALLOWED_AVATARS = ["❤️", "🧡", "💛", "💚", "💙", "💜", "🤍", "🖤", "💖", "💘"] as const;

type Props = {
  currentName: string;
  currentAvatar: string;
};

export function ProfileForm({ currentName, currentAvatar }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const normalizedAvatar =
    typeof currentAvatar === "string" && (ALLOWED_AVATARS as readonly string[]).includes(currentAvatar)
      ? currentAvatar
      : ALLOWED_AVATARS[0];
  const [selectedAvatar, setSelectedAvatar] = useState(normalizedAvatar);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("avatar", selectedAvatar);
    try {
      await updateProfile(formData);
      router.refresh();
    } finally {
      setSaving(false);
    }
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
          Icon
        </p>
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
      </div>

      <button
        type="submit"
        disabled={saving}
        className="mt-2 inline-flex items-center justify-center rounded-lg bg-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-pink-300/60 hover:bg-pink-400 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
