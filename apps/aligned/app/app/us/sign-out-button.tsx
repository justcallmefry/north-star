"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { unregisterNativeDeviceToken } from "@/lib/push-client";

export function SignOutButton() {
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    // Detach this phone from the account first, or the next person to sign
    // in here would receive this account's notifications.
    await unregisterNativeDeviceToken();
    await signOut({ callbackUrl: "/" });
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={busy}
      className="ns-btn-secondary mt-3 disabled:opacity-60"
    >
      {busy ? "Logging out…" : "Log out"}
    </button>
  );
}
