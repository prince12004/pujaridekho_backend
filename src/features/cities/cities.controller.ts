import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { CityModel } from "../../models/city.model.js";
import { PanditModel } from "../../models/pandit.model.js";

export const getPublicCities = asyncHandler(async (_req: Request, res: Response) => {
  const cities = await CityModel.find({ status: "Published", isServiceable: true }).sort({ sortOrder: 1, name: 1 });

  const counts = await PanditModel.aggregate([
    { $match: { accountStatus: "active", verificationStatus: "verified" } },
    { $unwind: "$cities" },
    { $group: { _id: "$cities", count: { $sum: 1 } } },
  ]);
  const countByCity = new Map(counts.map((c) => [String(c._id).toLowerCase(), c.count as number]));

  const withCounts = cities.map((city) => ({
    ...city.toObject(),
    panditCount: countByCity.get(city.name.toLowerCase()) ?? 0,
  }));

  sendSuccess(res, withCounts);
});
