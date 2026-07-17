// Next.js 16 requires both `middleware.ts` and `proxy.ts`.
// This file re-exports the proxy function so Next.js actually applies it.
export { default } from "./proxy";
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml).*)",
  ],
};
