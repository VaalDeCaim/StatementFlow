import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "INTERNAL_ERROR"
  | "UNAUTHORIZED"
  | "RATE_LIMITED";

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
): NextResponse {
  return NextResponse.json(
    { error: { code, message } },
    { status },
  );
}
