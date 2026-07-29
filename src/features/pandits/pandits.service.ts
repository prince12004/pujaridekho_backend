import { ApiError } from "../../lib/api-error.js";
import { PanditModel } from "../../models/pandit.model.js";

export interface PublicListPanditsQuery {
    page?: number;
    limit?: number;
    search?: string;
    city?: string;
    sort?: "rating" | "newest";
}

export async function listPublicPandits(query: PublicListPanditsQuery) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;

    const filter: Record<string, unknown> = {
        accountStatus: "active",
        verificationStatus: "verified",
    };

    if (query.search) filter.fullName = { $regex: query.search, $options: "i" };
    if (query.city) filter.cities = query.city;

    const sortStage: Record<string, 1 | -1> =
        query.sort === "rating" ? { rating: -1, completedPoojas: -1 } : { createdAt: -1 };

    const [items, total] = await Promise.all([
        PanditModel.find(filter).sort(sortStage).skip((page - 1) * limit).limit(limit),
        PanditModel.countDocuments(filter),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPublicPanditById(id: string) {
    const pandit = await PanditModel.findById(id);
    if (!pandit) throw ApiError.notFound("Pandit not found");
    return pandit;
}
