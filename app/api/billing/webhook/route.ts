import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import prisma from "@/lib/db";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const coachId = session.metadata?.coachId;
    const credits = parseInt(session.metadata?.credits ?? "0", 10);

    if (!coachId || !credits) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    await prisma.coach.update({
      where: { id: coachId },
      data: { credits: { increment: credits } },
    });

    await prisma.creditsTransaction.create({
      data: {
        coachId,
        amount: credits,
        reason: "stripe_purchase",
        stripeId: session.id,
      },
    });

    await createNotification(coachId, {
      title: "Credits added!",
      body: `${credits} credits have been added to your account.`,
      type: "success",
    });
  }

  return NextResponse.json({ received: true });
}
