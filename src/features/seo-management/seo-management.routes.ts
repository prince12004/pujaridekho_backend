import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import * as c from "./seo-management.controller.js";

// Public, read-only — consumed server-side by the Next.js site.
export const seoPagesRouter = Router();
seoPagesRouter.get("/directory", c.getPublicDirectory);
seoPagesRouter.get("/footer", c.getFooter);
seoPagesRouter.get("/sitemap", c.getSitemap);
seoPagesRouter.get("/redirects", c.getRedirects);
seoPagesRouter.get("/by-slug/:slug", c.getPublicSeoPage);

export const adminSeoManagementRouter = Router();
adminSeoManagementRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.SEO_MANAGE));

adminSeoManagementRouter.get("/locations", c.getLocations);
adminSeoManagementRouter.post("/locations", c.postLocation);
adminSeoManagementRouter.patch("/locations/:id", c.patchLocation);
adminSeoManagementRouter.delete("/locations/:id", c.removeLocation);

adminSeoManagementRouter.get("/pages", c.getPages);
adminSeoManagementRouter.post("/pages", c.postPage);
adminSeoManagementRouter.get("/pages/:id", c.getPage);
adminSeoManagementRouter.patch("/pages/:id", c.patchPage);
adminSeoManagementRouter.delete("/pages/:id", c.removePage);

adminSeoManagementRouter.get("/directory", c.getAdminDirectoryPreview);
adminSeoManagementRouter.patch("/directory", c.patchDirectory);

adminSeoManagementRouter.get("/footer", c.getFooterGroups);
adminSeoManagementRouter.put("/footer", c.putFooterGroups);

adminSeoManagementRouter.get("/redirects", c.getAdminRedirects);
adminSeoManagementRouter.post("/redirects", c.postRedirect);
adminSeoManagementRouter.patch("/redirects/:id", c.patchRedirect);
adminSeoManagementRouter.delete("/redirects/:id", c.removeRedirect);

adminSeoManagementRouter.get("/sitemap", c.getSitemapReport);
