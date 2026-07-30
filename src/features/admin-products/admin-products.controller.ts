import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import { createProduct, deleteProduct, getProductById, listProducts, updateProduct } from "./admin-products.service.js";

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  category: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  sku: z.string().optional(),
  sellingPrice: z.number().min(0),
  marketPrice: z.number().min(0).optional(),
  stockQuantity: z.number().optional(),
  inStock: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  status: z.enum(["draft", "Published", "archived"]).optional(),
  sortOrder: z.number().optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
});

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = listQuerySchema.parse(req.query);
  sendSuccess(res, await listProducts(query));
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await getProductById(req.params.id));
});

export const postProduct = asyncHandler(async (req: Request, res: Response) => {
  const input = productSchema.parse(req.body);
  const product = await createProduct(input, req.admin!.id);
  await recordAuditLog(req, req.admin!, {
    action: "create",
    entityType: "Product",
    entityId: product._id.toString(),
    description: `Created product "${product.name}"`,
  });
  sendSuccess(res, product, "Product created", 201);
});

export const patchProduct = asyncHandler(async (req: Request, res: Response) => {
  const input = productSchema.partial().parse(req.body);
  const product = await updateProduct(req.params.id, input, req.admin!.id);
  await recordAuditLog(req, req.admin!, {
    action: "update",
    entityType: "Product",
    entityId: product._id.toString(),
    description: `Updated product "${product.name}"`,
  });
  sendSuccess(res, product, "Product updated");
});

export const removeProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await getProductById(req.params.id);
  await deleteProduct(req.params.id);
  await recordAuditLog(req, req.admin!, {
    action: "delete",
    entityType: "Product",
    entityId: req.params.id,
    description: `Deleted product "${product.name}"`,
  });
  sendSuccess(res, null, "Product deleted");
});
