import { createClient } from "@neondatabase/neon-js";

const authUrl = process.env.NEXT_PUBLIC_NEON_AUTH_BASE_URL;
const dataApiUrl = process.env.NEXT_PUBLIC_NEON_DATA_API_URL;

export const dataApi =
  authUrl && dataApiUrl
    ? createClient({
        auth: { url: authUrl },
        dataApi: { url: dataApiUrl },
      })
    : null;

export type DataApiClient = NonNullable<typeof dataApi>;
