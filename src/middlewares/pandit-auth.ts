import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/api-error.js";
import { PanditModel } from "../models/pandit.model.js";
import { verifyPanditAccessToken } from "../lib/pandit-tokens.js";

export interface PanditAuthContext {
  id: string;
  fullName: string;
  mobile: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      pandit?: PanditAuthContext;
    }
  }
}

export async function requirePanditAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Login required");
    }

    const token = header.slice("Bearer ".length);
    const payload = verifyPanditAccessToken(token);

    const pandit = await PanditModel.findById(payload.sub);
    if (!pandit || pandit.accountStatus !== "active") {
      throw ApiError.unauthorized("Session is no longer valid");
    }

    req.pandit = { id: pandit._id.toString(), fullName: pandit.fullName, mobile: pandit.mobile };
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired session"));
  }
}
