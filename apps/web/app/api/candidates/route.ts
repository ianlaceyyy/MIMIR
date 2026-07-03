import { NextResponse } from "next/server";
import { getDistrict } from "@/lib/data";

// GET /api/candidates?district=<geoid>  -> the candidates running for that seat,
// in the neutral disclosed order. Read-only.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const geoid = searchParams.get("district");
  if (!geoid) {
    return NextResponse.json({ error: "Missing ?district=<geoid>" }, { status: 400 });
  }
  const district = await getDistrict(geoid);
  if (!district) {
    return NextResponse.json({ error: "District not found" }, { status: 404 });
  }
  return NextResponse.json({
    district: district.label,
    orderingRule: "Alphabetical by surname (A→Z)",
    candidates: district.candidates,
  });
}
