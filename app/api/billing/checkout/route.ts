import { NextRequest } from "next/server";
import { getStripe, CREDIT_PACKS } from "@/lib/stripe";
import { requireAuth } from "@/lib/session";
import { ok, err, unauthorized } from "@/lib/api-response";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  const { packId } = await req.json();
  const pack = CREDIT_PACKS.find(p => p.id === packId);
  if (!pack) return err("Invalid pack");

  const coach = await prisma.coach.findUnique({
    where: { id: coachId },
    select: { email: true, name: true },
  });
  if (!coach) return unauthorized();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: coach.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: pack.price * 100,
          product_data: {
            name: `CoachOS — ${pack.credits} Credits`,
            description: `${pack.credits} AI credits for CoachOS (${pack.label} pack)`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      coachId,
      credits: String(pack.credits),
      packId: pack.id,
    },
    success_url: `${appUrl}/dashboard?credits=purchased&amount=${pack.credits}`,
    cancel_url: `${appUrl}/dashboard`,
  });

  return ok({ url: session.url });
}
