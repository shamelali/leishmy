import { createServer } from "node:http";
import { once } from "node:events";
import { randomBytes, createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const CLIENT_ID = process.env.META_APP_ID?.trim();
if (!CLIENT_ID) {
  console.error(
    "❌ META_APP_ID is not set. Needed: the App ID of a Meta developer app with the " +
      '"Create & manage ads with ads MCP server" use case.',
  );
  process.exit(1);
}

const AUTH_URL = "https://www.facebook.com/v26.0/dialog/oauth";
const TOKEN_URL = "https://graph.facebook.com/v26.0/oauth/access_token";
const SCOPES =
  "ads_mcp_management ads_read ads_management catalog_management business_management pages_show_list instagram_basic";
const REDIRECT_PORT = 18372;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`;

function b64url(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function main() {
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  const state = b64url(randomBytes(16));

  const server = createServer();
  server.listen(REDIRECT_PORT, "127.0.0.1");
  const portOk = await new Promise((res) =>
    once(server, "listening").then(() => res(true as unknown), () => res(false)),
  );
  await once(server, "listening");

  const authUrl = `${AUTH_URL}?client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&state=${state}` +
    `&code_challenge=${challenge}&code_challenge_method=S256`;

  console.log("\n👉 Open this URL and sign in + Authorize with the BUSINESS account:\n");
  console.log(authUrl + "\n");
  console.log(`(Waiting for the callback on ${REDIRECT_URI} ...)`);

  const gotCode = new Promise<string>((resolve, reject) => {
    server.on("request", async (req, res) => {
      const url = new URL(req.url!, "http://localhost");
      if (url.pathname !== "/callback") {
        res.writeHead(404).end();
        return;
      }
      if (url.searchParams.get("state") !== state) {
        res.writeHead(400).end("state mismatch");
        reject(new Error("state mismatch"));
        return;
      }
      const code = url.searchParams.get("code");
      const err = url.searchParams.get("error_description") || url.searchParams.get("error");
      if (!code) {
        res.writeHead(400).end(err || "no code");
        reject(new Error(err || "no code returned"));
        return;
      }
      res.writeHead?.(200, { "Content-Type": "text/html" });
      res.end("<h3>Authorized! You can close this tab.</h3>");
      resolve(code);
    });
  });

  const code = await gotCode;

  const qs = new URLSearchParams({
    client_id: CLIENT_ID!,
    redirect_uri: REDIRECT_URI,
    code,
    code_verifier: verifier,
    grant_type: "authorization_code",
  });
  console.log("\n🔐 Exchanging code for token...");
  const tokRes = await fetch(`${TOKEN_URL}?${qs}`);
  const tokJson = await tokRes.json();
  const accessToken = tokJson.access_token;
  if (!accessToken) {
    console.error("❌ Token exchange failed:", JSON.stringify(tokJson, null, 2));
    server.close();
    process.exit(1);
  }
  console.log("✅ Got access token:", accessToken.slice(0, 12) + "...");

  const dir = process.cwd();
  for (const f of [".env.local", ".env"]) {
    const p = join(dir, f);
    if (!existsSync(p)) continue;
    let text = readFileSync(p, "utf8");
    const re = /^META_ADS_TOKEN=.*$/m;
    text = re.test(text) ? text.replace(re, `META_ADS_TOKEN=${accessToken}`) : text + `\nMETA_ADS_TOKEN=${accessToken}\n`;
    writeFileSync(p, text);
    console.log(`✅ Wrote token into ${f}`);
  }

  server.close();
  process.exit(0);
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});