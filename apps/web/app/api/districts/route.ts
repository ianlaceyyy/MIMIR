import { NextResponse } from "next/server";
import { listDistrictsByState } from "@/lib/data";

// GET /api/districts?state=IL  -> districts (+ candidate counts) for a state.
// Read-only JSON surface for embeds / third-party civic tools. Non-partisan output.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state");
  if (!state) {
    return NextResponse.json({ error: "Missing ?state=XX" }, { status: 400 });
  }
  const districts = await listDistrictsByState(state);
  return NextResponse.json({ state: state.toUpperCase(), districts });
}
