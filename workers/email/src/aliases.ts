export const ALIASES: Record<string, string> = {
  "shamel@leish.my": "shamelali@gmail.com",
  "leiynda@leish.my": "leishstudio.main@gmail.com",
  "support@leish.my": "leishstudio.main@gmail.com",
  "admin@leish.my": "leishstudio.main@gmail.com",
  "billing@leish.my": "leishstudio.main@gmail.com",
  "hello@leish.my": "leishstudio.main@gmail.com",
  "studio@leish.my": "leishstudio.main@gmail.com",
  "artist@leish.my": "leishstudio.main@gmail.com",
};

export const CATCH_ALL = "leishstudio.main@gmail.com";

export function getDestination(recipient: string): string {
  const key = recipient.toLowerCase().trim();
  return ALIASES[key] ?? CATCH_ALL;
}
