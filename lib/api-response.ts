import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function err(error: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error }, { status });
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

export function notFound(resource = "Resource"): NextResponse {
  return NextResponse.json({ success: false, error: `${resource} not found` }, { status: 404 });
}
