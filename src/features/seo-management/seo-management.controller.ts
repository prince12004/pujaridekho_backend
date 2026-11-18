import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { ApiError } from "../../lib/api-error.js";
import { recordAuditLog } from "../../lib/audit.js";
import { SEO_LOCATION_TYPES } from "../../models/seo-location.model.js";
import { SEO_DIRECTORY_SECTIONS, SEO_PAGE_TYPES } from "../../models/seo-page.model.js";
import * as admin from "./seo-admin.service.js";
import { getSeoSettings, resetSeoSettings, saveSeoSettings } from "./seo-settings.service.js";
import { importStarterData } from "./starter-data.service.js";
import {
  getActiveRedirects,
  getDirectory,
  getPublicFooter,
  getPublicPageBySlug,
  getSitemapEntries,
} from "./seo-public.service.js";

// ---------------------------------------------------------------- Public

export const getPublicSeoPage = asyncHandler(async (req: Request, res: Response) => {
  const page = await getPublicPageBySlug(req.params.slug);
  if (!page) throw ApiError.notFound("Page not found");
  sendSuccess(res, page);
});

export const getPublicDirectory = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await getDirectory());
});

export const getFooter = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await getPublicFooter());
});

export const getSitemap = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await getSitemapEntries());
});

export const getRedirects = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await getActiveRedirects());
});

// ---------------------------------------------------------------- Admin

const audit = (req: Request, action: "create" | "update" | "delete", entityType: string, entityId: string, description: string) =>
  recordAuditLog(req, req.admin!, { action, entityType, entityId, description });

const locationSchema = z.object({
  type: z.enum(SEO_LOCATION_TYPES),
  name: z.string().trim().min(1),
  slug: z.string().trim().optional(),
  city: z.string().nullable().optional(),
  parent: z.string().nullable().optional(),
  areaLabel: z.string().trim().optional(),
  pincode: z.string().trim().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
  createPage: z.boolean().optional(),
});

export const getLocations = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as Record<string, string | undefined>;
  sendSuccess(res, await admin.listLocations({ type: q.type, city: q.city, search: q.search }));
});

export const postLocation = asyncHandler(async (req: Request, res: Response) => {
  const { createPage, ...input } = locationSchema.parse(req.body);
  const location = await admin.createLocation(input, { createPage });
  await audit(req, "create", "SeoLocation", location._id.toString(), `Created SEO location "${location.name}"`);
  sendSuccess(res, location, "Location created", 201);
});

export const patchLocation = asyncHandler(async (req: Request, res: Response) => {
  const input = locationSchema.omit({ createPage: true }).partial().parse(req.body);
  const location = await admin.updateLocation(req.params.id, input);
  await audit(req, "update", "SeoLocation", location._id.toString(), `Updated SEO location "${location.name}"`);
  sendSuccess(res, location, "Location updated");
});

export const removeLocation = asyncHandler(async (req: Request, res: Response) => {
  await admin.deleteLocation(req.params.id);
  await audit(req, "delete", "SeoLocation", req.params.id, "Deleted SEO location");
  sendSuccess(res, null, "Location deleted");
});

const pageSchema = z.object({
  pageType: z.enum(SEO_PAGE_TYPES),
  slug: z.string().trim().min(1),
  location: z.string().nullable().optional(),
  name: z.string().trim().min(1),
  h1: z.string().trim().max(120).optional(),
  metaTitle: z.string().trim().max(70, "Meta title should be 70 characters or fewer").optional(),
  metaDescription: z.string().trim().max(170, "Meta description should be 170 characters or fewer").optional(),
  intro: z.string().trim().max(1200).optional(),
  content: z.string().max(100_000).optional(),
  bannerImage: z.string().optional(),
  images: z.array(z.string()).optional(),
  heroTagline: z.string().trim().max(120).optional(),
  services: z
    .array(z.object({ label: z.string(), pooja: z.string().nullable().optional(), url: z.string().optional(), note: z.string().optional() }))
    .optional(),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
  internalLinks: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
  nearbyLocations: z.array(z.string()).optional(),
  coverageNote: z.string().trim().max(600).optional(),
  canonicalUrl: z.string().trim().optional(),
  indexable: z.boolean().optional(),
  status: z.enum(["draft", "published"]).optional(),
  showInDirectory: z.boolean().optional(),
  directorySection: z.enum(SEO_DIRECTORY_SECTIONS).optional(),
  directoryOrder: z.number().optional(),
});

export const getPages = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as Record<string, string | undefined>;
  sendSuccess(res, await admin.listPages({ pageType: q.pageType, status: q.status, city: q.city, search: q.search, needsContent: q.needsContent }));
});

export const getPage = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await admin.getPage(req.params.id));
});

export const postPage = asyncHandler(async (req: Request, res: Response) => {
  const page = await admin.createPage(pageSchema.parse(req.body));
  await audit(req, "create", "SeoPage", page._id.toString(), `Created SEO page /${page.slug}`);
  sendSuccess(res, page, "Page created", 201);
});

export const patchPage = asyncHandler(async (req: Request, res: Response) => {
  const page = await admin.updatePage(req.params.id, pageSchema.partial().parse(req.body));
  await audit(req, "update", "SeoPage", page._id.toString(), `Updated SEO page /${page.slug} (${page.status})`);
  sendSuccess(res, page, "Page saved");
});

export const removePage = asyncHandler(async (req: Request, res: Response) => {
  await admin.deletePage(req.params.id);
  await audit(req, "delete", "SeoPage", req.params.id, "Deleted SEO page");
  sendSuccess(res, null, "Page deleted");
});

const directorySchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      showInDirectory: z.boolean().optional(),
      directorySection: z.enum(SEO_DIRECTORY_SECTIONS).optional(),
      directoryOrder: z.number().optional(),
    }),
  ),
});

export const patchDirectory = asyncHandler(async (req: Request, res: Response) => {
  const { items } = directorySchema.parse(req.body);
  await admin.bulkUpdateDirectory(items);
  sendSuccess(res, null, "Directory updated");
});

export const getAdminDirectoryPreview = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await getDirectory());
});

const footerSchema = z.object({
  groups: z.array(
    z.object({
      key: z.string().trim().min(1),
      title: z.string().trim().min(1),
      isActive: z.boolean().optional(),
      kind: z.enum(["links", "tags", "cities", "categories", "poojas", "blogs", "text"]).optional(),
      body: z.string().trim().max(1200).optional(),
      limit: z.number().int().min(1).max(30).optional(),
      links: z.array(z.object({ label: z.string().trim().min(1), url: z.string().trim().min(1), isActive: z.boolean().optional() })).default([]),
    }),
  ),
});

export const getFooterGroups = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await admin.listFooterGroups());
});

export const putFooterGroups = asyncHandler(async (req: Request, res: Response) => {
  const { groups } = footerSchema.parse(req.body);
  const saved = await admin.saveFooterGroups(groups);
  await audit(req, "update", "SeoFooter", "footer", "Updated footer SEO links");
  sendSuccess(res, saved, "Footer saved");
});

const redirectSchema = z.object({
  fromPath: z.string().trim().min(1),
  toPath: z.string().trim().min(1),
  statusCode: z.union([z.literal(301), z.literal(302), z.literal(308)]).optional(),
  isActive: z.boolean().optional(),
  note: z.string().optional(),
});

export const getAdminRedirects = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await admin.listRedirects());
});

export const postRedirect = asyncHandler(async (req: Request, res: Response) => {
  const redirect = await admin.saveRedirect(redirectSchema.parse(req.body));
  await audit(req, "create", "SeoRedirect", redirect._id.toString(), `Redirect ${redirect.fromPath} → ${redirect.toPath}`);
  sendSuccess(res, redirect, "Redirect created", 201);
});

export const patchRedirect = asyncHandler(async (req: Request, res: Response) => {
  const redirect = await admin.saveRedirect(redirectSchema.parse(req.body), req.params.id);
  await audit(req, "update", "SeoRedirect", redirect._id.toString(), `Redirect ${redirect.fromPath} → ${redirect.toPath}`);
  sendSuccess(res, redirect, "Redirect saved");
});

export const removeRedirect = asyncHandler(async (req: Request, res: Response) => {
  await admin.deleteRedirect(req.params.id);
  await audit(req, "delete", "SeoRedirect", req.params.id, "Deleted redirect");
  sendSuccess(res, null, "Redirect deleted");
});

export const getSitemapReport = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await admin.getSitemapReport());
});

// ---------------------------------------------------------------- Page content settings

export const getPublicSeoSettings = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await getSeoSettings());
});

const titledText = z.object({ title: z.string().trim().max(120), text: z.string().trim().max(400) });
const settingsSchema = z.object({
  landing: z.record(z.string(), z.union([z.string().max(400), z.array(titledText).max(8)])).optional(),
  directory: z.record(z.string(), z.string().max(600)).optional(),
  footer: z
    .object({
      blurb: z.string().max(600).optional(),
      bookButtonLabel: z.string().max(40).optional(),
      bookButtonUrl: z
        .string()
        .max(300)
        .refine((v) => !v || /^(\/|https?:\/\/)/.test(v), "Button link must start with / or http")
        .optional(),
      newsletterTitle: z.string().max(120).optional(),
      newsletterText: z.string().max(300).optional(),
      trustBadges: z.array(z.string().trim().max(80)).max(6).optional(),
      copyright: z.string().max(200).optional(),
      showAllLocationsLink: z.boolean().optional(),
    })
    .optional(),
});

export const getAdminSeoSettings = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await getSeoSettings());
});

export const putSeoSettings = asyncHandler(async (req: Request, res: Response) => {
  const input = settingsSchema.parse(req.body);
  const saved = await saveSeoSettings(input as never);
  await audit(req, "update", "SeoSettings", "global", "Updated SEO page content settings");
  sendSuccess(res, saved, "Settings saved");
});

export const postResetSeoSettings = asyncHandler(async (req: Request, res: Response) => {
  const data = await resetSeoSettings();
  await audit(req, "update", "SeoSettings", "global", "Reset SEO page content settings to defaults");
  sendSuccess(res, data, "Settings reset");
});

const importSchema = z.object({
  dryRun: z.boolean().optional(),
  locations: z.boolean().optional(),
  pages: z.boolean().optional(),
  footer: z.boolean().optional(),
  resetFooter: z.boolean().optional(),
  publishDraftsNoindex: z.boolean().optional(),
});

export const postImportStarter = asyncHandler(async (req: Request, res: Response) => {
  const options = importSchema.parse(req.body ?? {});
  const report = await importStarterData(options);
  if (!options.dryRun) {
    await audit(req, "create", "SeoStarterData", "starter", `Imported SEO starter data (${report.locations} locations, ${report.published} pages)`);
  }
  sendSuccess(res, report, options.dryRun ? "Preview ready" : "Starter data imported");
});
