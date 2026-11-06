import { NextResponse } from "next/server";
import { analyze } from "@/lib/render";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  let url = "";
  try {
    ({ url } = await req.json());
  } catch {}
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Enter a website address." }, { status: 400 });
  }
  try {
    const result = await analyze(url);
    return NextResponse.json(result);
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.name === "TimeoutError" ? "That site took too long to respond. Try again." : e.message.includes("fetch failed") ? "Couldn't reach that site. Check the address." : e.message
        : "Something went wrong.";
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
