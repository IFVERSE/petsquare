import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { syncPetData } from "@/lib/apify/pet-data";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || !supplied) return false;
  const expectedBuffer = Buffer.from(secret);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

async function run(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await syncPetData());
  } catch (error) {
    console.error("Apify pet-data sync failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Pet-data sync failed" }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
