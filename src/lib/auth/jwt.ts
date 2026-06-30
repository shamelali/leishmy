import jwt from "jsonwebtoken";

const AUTH_SECRET = process.env.AUTH_SECRET || "leish-nextauth-secret-change-in-production";

export interface SessionPayload {
  id: string;
  email: string;
  role: string;
  name: string | null;
  avatar: string | null;
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, AUTH_SECRET, { expiresIn: "30d" });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, AUTH_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}
