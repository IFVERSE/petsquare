export type VendorSearchResult = { title: string; url: string; content: string; score: number };

export async function searchPetVendors(query: string, location?: string): Promise<VendorSearchResult[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) throw new Error("TAVILY_API_KEY is not configured.");
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      query: `${query} pet vendors stores veterinary grooming boarding ${location || ""}`.trim(),
      search_depth: "advanced",
      max_results: 8,
      include_raw_content: false,
    }),
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Tavily search failed (${response.status}).`);
  const data = await response.json();
  return (Array.isArray(data.results) ? data.results : []).map((item: VendorSearchResult) => ({
    title: String(item.title || ""), url: String(item.url || ""),
    content: String(item.content || "").slice(0, 6000), score: Number(item.score) || 0,
  }));
}
