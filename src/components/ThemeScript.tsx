"use client";

import Script from "next/script";

export function ThemeScript({ nonce }: { nonce?: string }) {
  return (
    <Script
      id="theme-init"
      strategy="afterInteractive"
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var theme = localStorage.getItem('leish_theme');
              if (theme === 'light') {
                document.documentElement.classList.remove('dark');
              } else {
                document.documentElement.classList.add('dark');
              }
            } catch(e) {
              document.documentElement.classList.add('dark');
            }
          })();
        `
      }}
    />
  );
}
