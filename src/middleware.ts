import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";

const intl = createMiddleware({
  locales: ["en", "ms-MY", "ta-MY", "zh-MY"],
  defaultLocale: "en",
});

export default async function middleware(request: NextRequest) {
  return intl(request);
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|monitoring|.*\\..*).*)",
  ],
};
