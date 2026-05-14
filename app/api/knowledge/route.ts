import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { ok, created, err, unauthorized } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const tagsParam = url.searchParams.get("tags");
  const tags = tagsParam ? tagsParam.split(",").filter(Boolean) : null;

  const entries = await prisma.knowledgeEntry.findMany({
    where: {
      coachId,
      ...(q && {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
        ],
      }),
      ...(tags?.length && { tags: { hasSome: tags } }),
    },
    orderBy: { createdAt: "desc" },
  });

  return ok({ entries });
}

export async function POST(req: NextRequest) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  try {
    const body = await req.json();
    if (!body.title || !body.content) return err("title and content are required");

    const entry = await prisma.knowledgeEntry.create({
      data: {
        coachId,
        title: body.title,
        content: body.content,
        tags: Array.isArray(body.tags) ? body.tags : [],
        source: "manual",
      },
    });

    return created({ entry });
  } catch (error) {
    console.error("Create knowledge entry failed:", error);
    return err("Create failed", 500);
  }
}
