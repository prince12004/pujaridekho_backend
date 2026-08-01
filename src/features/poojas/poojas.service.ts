import { ApiError } from "../../lib/api-error.js";
import { PoojaModel } from "../../models/pooja.model.js";

export interface PublicListPoojasQuery {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    featured?: boolean;
}

export async function listPublicPoojas(query: PublicListPoojasQuery) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;

    const filter: Record<string, unknown> = { status: "Published" };
    if (query.search) filter.name = { $regex: query.search, $options: "i" };
    if (query.featured) filter.featured = true;

    const items = await PoojaModel.find(filter)
        .populate("category", "name slug")
        .sort({ sortOrder: 1, createdAt: -1 });

    const filtered = query.category
        ? items.filter((item) => {
            const category = item.category as { slug?: string } | undefined;
            return category?.slug === query.category;
        })
        : items;

    const total = filtered.length;
    const paged = filtered.slice((page - 1) * limit, page * limit);

    return { items: paged, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPublicPoojaBySlug(slug: string) {
    const pooja = await PoojaModel.findOne({ slug, status: "Published" })
        .populate("category", "name slug")
        .populate("samagriTemplate");
    if (!pooja) throw ApiError.notFound("Pooja not found");
    return pooja;
}
