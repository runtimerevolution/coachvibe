import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { ok, created, err, unauthorized } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  const products = await prisma.product.findMany({
    where: { coachId },
    include: { landingPage: { select: { slug: true, published: true } } },
    orderBy: { createdAt: "asc" },
  });

  return ok({ products });
}

export async function POST(req: NextRequest) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  try {
    const body = await req.json();
    if (!body.name) return err("name is required");

    const product = await prisma.product.create({
      data: {
        coachId,
        name: body.name,
        description: body.description ?? "",
        price: body.price ?? 0,
        type: body.type ?? "lead_magnet",
        modules: body.modules ?? [],
        embedScript: body.embedScript ?? "",
      },
    });

    return created({ product });
  } catch (error) {
    console.error("Create product failed:", error);
    return err("Create failed", 500);
  }
}
