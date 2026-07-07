import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ms-MY", "zh-MY", "ta-MY"],
  defaultLocale: "en",
  localePrefix: "never",
  localeDetection: true,
});
