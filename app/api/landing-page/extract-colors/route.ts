import { NextRequest, NextResponse } from "next/server";
import { extractColorsDeep } from "@/lib/landing-page/color-extractor";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || !url.startsWith("http")) {
      return NextResponse.json({ success: false, error: "Valid URL required" }, { status: 400 });
    }
    const colors = await extractColorsDeep(url);
    return NextResponse.json({ success: true, colors });
  } catch (error) {
    console.error("Color extraction failed:", error);
    return NextResponse.json({ success: false, error: "Extraction failed" }, { status: 500 });
  }
}
