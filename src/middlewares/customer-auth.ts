import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/api-error.js";
import { CustomerModel } from "../models/customer.model.js";
import { verifyCustomerAccessToken } from "../lib/customer-tokens.js";

export interface CustomerAuthContext {
  id: string;
  name: string;
  mobile: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      customer?: CustomerAuthContext;
    }
  }
}

export async function requireCustomerAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Login required");
    }

    const token = header.slice("Bearer ".length);
    const payload = verifyCustomerAccessToken(token);

    const customer = await CustomerModel.findById(payload.sub);
    if (!customer || customer.status !== "active") {
      throw ApiError.unauthorized("Session is no longer valid");
    }

    req.customer = {
      id: customer._id.toString(),
      name: customer.name,
      mobile: customer.mobile,
    };
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired session"));
  }
}

/** Attaches req.customer if a valid token is present, but never rejects — used by
 * endpoints (like public Kundli generation) that work for guests but persist
 * extra data when the caller happens to be logged in. */
export async function attachCustomerIfPresent(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return next();

    const token = header.slice("Bearer ".length);
    const payload = verifyCustomerAccessToken(token);
    const customer = await CustomerModel.findById(payload.sub);
    if (customer && customer.status === "active") {
      req.customer = { id: customer._id.toString(), name: customer.name, mobile: customer.mobile };
    }
    next();
  } catch {
    next();
  }
}
