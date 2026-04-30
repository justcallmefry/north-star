import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { deleteOwnAccount } from "@/lib/account";

export async function POST() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await deleteOwnAccount(session.user.id);
  return NextResponse.json({ ok: true });
}
