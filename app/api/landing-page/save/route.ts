import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import type { LandingPageData } from "@/lib/landing-page/types";
import { requireAuth } from "@/lib/session";
import { ok, err, unauthorized } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  try {
    const data: LandingPageData = await req.json();

    await prisma.landingPage.upsert({
      where: { productId: data.productId },
      update: { slug: data.slug, data: data as object, published: data.published, updatedAt: new Date() },
      create: { productId: data.productId, coachId, slug: data.slug, data: data as object, published: data.published },
    });

    if (data.published) {
      await logActivity(coachId, "landing_page.published", `${data.productName ?? "Landing page"} is now live`, { slug: data.slug });
      await createNotification(coachId, {
        title: "Landing page published!",
        body: `Your page for ${data.productName ?? "your product"} is now live at /shop/${data.slug}`,
        type: "success",
      });
    }

    return ok({});
  } catch (error) {
    console.error("Save landing page failed:", error);
    return err("Save failed", 500);
  }
}
