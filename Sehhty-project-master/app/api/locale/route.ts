import { NextResponse } from "next/server";
import {
  LOCALE_COOKIE_NAME,
  type Locale,
  resolveLocale,
} from "@/lib/i18n/config";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    locale?: Locale;
  };

  const locale = resolveLocale(body?.locale);
  const response = NextResponse.json({ ok: true, locale });

  response.cookies.set(LOCALE_COOKIE_NAME, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}
