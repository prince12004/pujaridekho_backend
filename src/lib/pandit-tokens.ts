import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const ACCESS_TOKEN_TTL = "12h";
const REFRESH_TOKEN_TTL = "30d";

interface PanditTokenPayload {
  sub: string;
  type: "access" | "refresh";
}

export function signPanditAccessToken(panditId: string) {
  return jwt.sign({ sub: panditId, type: "access" } satisfies PanditTokenPayload, env.PANDIT_JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

export function signPanditRefreshToken(panditId: string) {
  return jwt.sign({ sub: panditId, type: "refresh" } satisfies PanditTokenPayload, env.PANDIT_JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL,
  });
}

export function verifyPanditAccessToken(token: string) {
  const payload = jwt.verify(token, env.PANDIT_JWT_SECRET) as PanditTokenPayload;
  if (payload.type !== "access") throw new Error("Not an access token");
  return payload;
}

export function verifyPanditRefreshToken(token: string) {
  const payload = jwt.verify(token, env.PANDIT_JWT_SECRET) as PanditTokenPayload;
  if (payload.type !== "refresh") throw new Error("Not a refresh token");
  return payload;
}

export function issuePanditTokenPair(panditId: string) {
  return {
    token: signPanditAccessToken(panditId),
    refreshToken: signPanditRefreshToken(panditId),
  };
}
