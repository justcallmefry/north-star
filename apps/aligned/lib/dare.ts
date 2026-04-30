"use server";

import { revalidatePath } from "next/cache";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireActiveMember } from "@/lib/relationship-members";

export type Dare = { title: string; description: string; duration: string };

const DARES: Dare[] = [
  { title: "Cook something neither of you has made before", description: "No recipes allowed. Improvise from whatever's in the kitchen.", duration: "~45 min" },
  { title: "Take a walk with no destination", description: "Put your phones away. Just walk and talk until you feel like turning back.", duration: "~30 min" },
  { title: "Watch a movie the other person picks — no complaining", description: "One of you picks something the other hasn't seen. No vetoes allowed.", duration: "~2 hours" },
  { title: "Write each other a letter by hand", description: "Old school. No texts. Deliver it in person and read yours out loud.", duration: "~20 min" },
  { title: "Find somewhere new in your neighborhood", description: "Walk or drive somewhere within 20 minutes that neither of you has been to together.", duration: "~1 hour" },
  { title: "Cook your partner's favorite meal from scratch", description: "You pick theirs, they pick yours. Eat together with no screens.", duration: "~1 hour" },
  { title: "Take photos of each other like tourists", description: "Pretend you're visiting your own city for the first time. Document the day.", duration: "~1 hour" },
  { title: "Sit somewhere and people-watch for 20 minutes", description: "A café, a park, a bench. No agenda. Just exist somewhere together.", duration: "~20 min" },
  { title: "Watch the sun set or rise together", description: "Find a good spot. No scrolling. Just be there for it.", duration: "~30 min" },
  { title: "Make a playlist for each other", description: "10 songs that remind you of them, or that you want them to hear. Share at the same time.", duration: "~30 min" },
  { title: "Do something one of you has been putting off", description: "Pick one task that's been sitting on a shared to-do list. Do it together this week.", duration: "~1 hour" },
  { title: "Eat somewhere you've never been together", description: "A new restaurant, a food truck, a place one of you has been meaning to try.", duration: "~1 hour" },
  { title: "Spend an evening offline", description: "From dinner until bed: no phones, no TV, no screens. Fill the time however you want.", duration: "~3 hours" },
  { title: "Make something with your hands together", description: "Bake, build, paint, draw, plant something. The result doesn't have to be good.", duration: "~1 hour" },
  { title: "Go somewhere in nature", description: "A trail, a lake, a park, a backyard fire. Somewhere that isn't a building.", duration: "~1-2 hours" },
  { title: "Revisit somewhere meaningful to your relationship", description: "Where you had a first date, a first trip, or a moment you remember. Go back.", duration: "~1 hour" },
  { title: "Stay in bed an extra hour on purpose", description: "No alarms, no agenda. Just lazy time together before the day starts.", duration: "~1 hour" },
  { title: "Tell each other three things you never say out loud", description: "Not appreciation — things you assume the other knows. Say them anyway.", duration: "~20 min" },
  { title: "Play a game you haven't played in years", description: "A board game, a card game, a video game, a sport. Compete or cooperate.", duration: "~1 hour" },
  { title: "Do something one of you is scared of trying", description: "Small or big. One of you nominates it, both of you show up.", duration: "Varies" },
  { title: "Give each other a full hour of undivided attention", description: "One at a time. One hour on whatever they want — talk, activity, nothing. Then switch.", duration: "~2 hours" },
  { title: "Find the best view near you", description: "Drive or walk to the highest or most scenic spot within an hour. Bring something to drink.", duration: "~1-2 hours" },
  { title: "Cook breakfast together on a weekday", description: "Wake up early enough to sit down and eat. No rushing.", duration: "~45 min" },
  { title: "Read the same article or chapter and discuss it", description: "Pick something long — a feature story, an essay, a chapter of a book. Both read it. Talk about it.", duration: "~45 min" },
  { title: "Recreate your first date as closely as you can", description: "Same place, similar food, similar energy. Notice what's different now.", duration: "~2 hours" },
  { title: "Do something physical together you've never tried", description: "A yoga class, a hike, a bike ride, swimming, dancing. Move your bodies in a new way.", duration: "~1 hour" },
  { title: "Visit a market or shop you've never been to together", description: "A farmers market, antique shop, bookstore, plant nursery. Browse with no intention to buy.", duration: "~1 hour" },
  { title: "Ask each other 5 questions you've never asked before", description: "Not 'how was your day.' Go deeper. Spend 20 minutes on each question.", duration: "~1 hour" },
];

function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function pickDareIndex(relationshipId: string, weekKey: string): number {
  let hash = 0;
  const str = relationshipId + weekKey;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return hash % DARES.length;
}

export type DareForWeekResult = {
  dareId: string;
  dare: Dare;
  weekKey: string;
  accepted: boolean;
  completed: boolean;
};

export async function getDareForWeek(relationshipId: string): Promise<DareForWeekResult> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");
  await requireActiveMember(session.user.id, relationshipId);

  const weekKey = isoWeekKey(new Date());
  const dareIndex = pickDareIndex(relationshipId, weekKey);

  let dare = await prisma.dateNightDare.findUnique({
    where: { relationshipId_weekKey: { relationshipId, weekKey } },
  });
  if (!dare) {
    dare = await prisma.dateNightDare.create({
      data: { relationshipId, weekKey, dareIndex },
    });
  }

  return {
    dareId: dare.id,
    dare: DARES[dare.dareIndex] ?? DARES[0]!,
    weekKey,
    accepted: !!dare.acceptedAt,
    completed: !!dare.completedAt,
  };
}

export async function acceptDare(dareId: string): Promise<void> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");
  const dare = await prisma.dateNightDare.findUnique({ where: { id: dareId } });
  if (!dare) throw new Error("Dare not found");
  await requireActiveMember(session.user.id, dare.relationshipId);
  if (!dare.acceptedAt) {
    await prisma.dateNightDare.update({ where: { id: dareId }, data: { acceptedAt: new Date() } });
  }
  revalidatePath("/app/dare");
  revalidatePath("/app");
}

export async function completeDare(dareId: string): Promise<void> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");
  const dare = await prisma.dateNightDare.findUnique({ where: { id: dareId } });
  if (!dare) throw new Error("Dare not found");
  await requireActiveMember(session.user.id, dare.relationshipId);
  await prisma.dateNightDare.update({
    where: { id: dareId },
    data: { acceptedAt: dare.acceptedAt ?? new Date(), completedAt: new Date() },
  });
  revalidatePath("/app/dare");
  revalidatePath("/app");
}
