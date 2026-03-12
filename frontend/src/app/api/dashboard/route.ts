import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/server-data";
import { apiError } from "@/lib/api-response";

const GENERIC_MESSAGE = "An error occurred";

export async function GET() {
  try {
    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch {
    return apiError("INTERNAL_ERROR", GENERIC_MESSAGE, 500);
  }
}
