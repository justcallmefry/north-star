"use client";

import { useState, useRef, useEffect } from "react";
import { setReactions, setAcknowledgment } from "@/lib/sessions";
import {
  VALIDATION_ACK_MAX_LENGTH,
  VALIDATION_ALLOWED_EMOJIS,
  type ResponseValidationData,
} from "@north-star/shared";

function parseReactions(s: string | null): string[] {
  if (!s) return [];
  const result: string[] = [];
  let rest = s;
  while (rest && result.length < 2) {
    const found = VALIDATION_ALLOWED_EMOJIS.find((e) => rest.startsWith(e));
    if (!found) break;
    result.push(found);
    rest = rest.slice(found.length);
  }
  return result;
}

type Props = {
  responseId: string;
  content: string | null;
  title: string;
  titleTextClass?: string;
  icon: React.ReactNode;
  bubbleClass: string;
  validation: ResponseValidationData | null;
  /** True when this is the partner's bubble (current user can add validation) */
  canValidate: boolean;
  /** When partner response is missing, hide validation UI */
  hasPartnerResponse: boolean;
  /** True when this member did not answer that day — show "No response that day" */
  noResponse?: boolean;
};

export function ResponseBubbleValidation({
  responseId,
  content,
  title,
  titleTextClass = "text-slate-900",
  icon,
  bubbleClass,
  validation,
  canValidate,
  hasPartnerResponse,
  noResponse = false,
}: Props) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [ackOpen, setAckOpen] = useState(false);
  const [ackText, setAckText] = useState(validation?.acknowledgment ?? "");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const ackInputRef = useRef<HTMLInputElement>(null);

  const currentReactions = parseReactions(validation?.reactions ?? null);
  const displayReactions = validation?.reactions ? parseReactions(validation.reactions) : [];
  const displayAck = validation?.acknowledgment?.trim() ?? "";

  useEffect(() => {
    setAckText(validation?.acknowledgment ?? "");
  }, [validation?.acknowledgment]);

  useEffect(() => {
    if (!popoverOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setPopoverOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverOpen]);

  useEffect(() => {
    if (ackOpen) ackInputRef.current?.focus();
  }, [ackOpen]);

  async function handleReactionSelect(emoji: string) {
    let next = currentReactions.includes(emoji)
      ? currentReactions.filter((e) => e !== emoji)
      : [...currentReactions, emoji].slice(0, 2);
    setError(null);
    setLoading("reactions");
    try {
      await setReactions(responseId, next);
      setPopoverOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(null);
    }
  }

  async function handleAckSubmit() {
    const trimmed = ackText.trim().slice(0, VALIDATION_ACK_MAX_LENGTH);
    setError(null);
    setLoading("ack");
    try {
      await setAcknowledgment(responseId, trimmed);
      setAckOpen(false);
      setAckText(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(null);
    }
  }

  if (noResponse) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-base">
            {typeof icon === "string" && icon.trim().startsWith("http") ? (
              <img src={icon.trim()} alt="" className="absolute inset-0 h-full w-full object-cover" width={32} height={32} />
            ) : (
              icon
            )}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${titleTextClass} ${bubbleClass}`}>
            {title}
          </span>
        </div>
        <p className="mt-2 ns-card-inner px-3 py-3 text-base italic text-slate-500 sm:text-lg">
          No response that day
        </p>
      </div>
    );
  }

  if (!hasPartnerResponse) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-base">
            {typeof icon === "string" && icon.trim().startsWith("http") ? (
              <img src={icon.trim()} alt="" className="absolute inset-0 h-full w-full object-cover" width={32} height={32} />
            ) : (
              icon
            )}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${titleTextClass} ${bubbleClass}`}>
            {title}
          </span>
        </div>
        <p className="mt-2 ns-card-inner px-3 py-3 text-base leading-relaxed text-slate-900 sm:text-lg">
          {content ?? "—"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-base">
          {typeof icon === "string" && icon.trim().startsWith("http") ? (
            <img src={icon.trim()} alt="" className="absolute inset-0 h-full w-full object-cover" width={32} height={32} />
          ) : (
            icon
          )}
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${titleTextClass} ${bubbleClass}`}>
          {title}
        </span>
      </div>
      <p className="mt-2 ns-card-inner px-3 py-3 text-base leading-relaxed text-slate-900 sm:text-lg">
        {content ?? "—"}
      </p>

      <div className="flex flex-col gap-1.5 pl-1">
        {displayReactions.length > 0 && (
          <p className="flex items-center gap-1.5 text-base text-slate-600" aria-label="Reactions">
            {displayReactions.map((emoji, i) => (
              <span key={`${emoji}-${i}`}>{emoji}</span>
            ))}
          </p>
        )}
        {displayAck && (
          <p className="text-sm text-slate-600 italic">&ldquo;{displayAck}&rdquo;</p>
        )}

        {canValidate && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <div className="relative" ref={popoverRef}>
              <button
                type="button"
                onClick={() => setPopoverOpen((o) => !o)}
                disabled={!!loading}
                className="text-xs font-medium text-slate-500 underline decoration-slate-300 hover:text-slate-700 hover:decoration-slate-400"
              >
                React
              </button>
              {popoverOpen && (
                <div className="absolute left-0 top-full z-10 mt-1 flex gap-1">
                  {VALIDATION_ALLOWED_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleReactionSelect(emoji)}
                      className={`rounded p-1.5 text-xl transition hover:bg-slate-100 ${
                        currentReactions.includes(emoji) ? "bg-brand-50 ring-1 ring-brand-200" : ""
                      }`}
                      aria-pressed={currentReactions.includes(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {!ackOpen ? (
              <button
                type="button"
                onClick={() => setAckOpen(true)}
                className="text-xs font-medium text-slate-500 underline decoration-slate-300 hover:text-slate-700 hover:decoration-slate-400"
              >
                {displayAck ? "Edit acknowledgment" : "Add acknowledgment"}
              </button>
            ) : (
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <input
                  ref={ackInputRef}
                  type="text"
                  value={ackText}
                  onChange={(e) => setAckText(e.target.value.slice(0, VALIDATION_ACK_MAX_LENGTH))}
                  placeholder="Acknowledgment (max 100 characters)"
                  maxLength={VALIDATION_ACK_MAX_LENGTH}
                  className="min-w-[12rem] flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-200"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAckSubmit();
                    }
                    if (e.key === "Escape") {
                      setAckOpen(false);
                      setAckText(validation?.acknowledgment ?? "");
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAckSubmit}
                  disabled={!!loading}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  {loading === "ack" ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAckOpen(false);
                    setAckText(validation?.acknowledgment ?? "");
                  }}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
