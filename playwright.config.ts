import { defineConfig } from "@playwright/test";
import { config } from "dotenv";
import { existsSync } from "fs";

const envPath = existsSync(".env.test") ? ".env.test" : ".env";
config({ path: envPath });

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: "npx next dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
