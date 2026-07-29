import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const ACCESS_TOKEN_TTL = "1h";
const REFRESH_TOKEN_TTL = "30d";

interface CustomerTokenPayload {
  sub: string;
  type: "access" | "refresh";
}

export function signCustomerAccessToken(customerId: string) {
  return jwt.sign({ sub: customerId, type: "access" } satisfies CustomerTokenPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

export function signCustomerRefreshToken(customerId: string) {
  return jwt.sign({ sub: customerId, type: "refresh" } satisfies CustomerTokenPayload, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL,
  });
}

export function verifyCustomerAccessToken(token: string) {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as CustomerTokenPayload;
  if (payload.type !== "access") throw new Error("Not an access token");
  return payload;
}

export function verifyCustomerRefreshToken(token: string) {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as CustomerTokenPayload;
  if (payload.type !== "refresh") throw new Error("Not a refresh token");
  return payload;
}

export function issueCustomerTokenPair(customerId: string) {
  return {
    accessToken: signCustomerAccessToken(customerId),
    refreshToken: signCustomerRefreshToken(customerId),
  };
}
