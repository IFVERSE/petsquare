import { NextRequest, NextResponse } from "next/server";
import { searchPetVendors } from "@/lib/tools/search-pet-vendors";
import { fetchVendorPage } from "@/lib/tools/fetch-vendor-page";
import { extractVendorData } from "@/lib/tools/extract-vendor-data";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!process.env.TAVILY_API_KEY || !process.env.GROQ_API_KEY) return NextResponse.json({ error: "Pet discovery needs TAVILY_API_KEY and GROQ_API_KEY." }, { status: 503 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const input = body as { query?: unknown; location?: unknown };
  const query = typeof input?.query === "string" ? input.query.trim() : "";
  const location = typeof input?.location === "string" ? input.location.trim() : "";
  if (query.length < 2 || query.length > 160 || location.length > 100) return NextResponse.json({ error: "Enter a search between 2 and 160 characters." }, { status: 400 });
  try {
    const results = await searchPetVendors(query, location);
    const settled = await Promise.allSettled(results.slice(0, 5).map(async (result) => {
      let page;
      try { page = await fetchVendorPage(result.url); }
      catch { page = { url: result.url, title: result.title, content: result.content }; }
      return extractVendorData(page);
    }));
    const vendors = settled.flatMap((item) => item.status === "fulfilled" && item.value ? [item.value] : []);
    const unique = [...new Map(vendors.map((vendor) => [new URL(vendor.sourceUrl).hostname.replace(/^www\./, ""), vendor])).values()];
    return NextResponse.json({ vendors: unique, sources: results.map(({ title, url }) => ({ title, url })) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Discovery failed." }, { status: 502 });
  }
}
