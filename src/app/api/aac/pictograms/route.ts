import { searchArasaacPictograms } from "@/lib/aac/resolve-pictogram";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const lang = searchParams.get("lang")?.trim() || "en";

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchArasaacPictograms(query, lang, 24);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Unable to search symbols" }, { status: 500 });
  }
}
