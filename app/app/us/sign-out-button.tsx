"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="ns-btn-secondary mt-3"
    >
      Log out
    </button>
  );
}
