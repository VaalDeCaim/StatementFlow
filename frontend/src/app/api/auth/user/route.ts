import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-data";
import { apiError } from "@/lib/api-response";

const GENERIC_MESSAGE = "An error occurred";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json(user);
  } catch {
    return apiError("INTERNAL_ERROR", GENERIC_MESSAGE, 500);
  }
}
