import { Router } from "express";
import { requireCrmAdmin, requireCrmAuth, requireCrmFullAccess, blockSuperadminMutations } from "../../middlewares/crm-auth.js";
import { getSalesPeople, postSalesPerson, putSalesPerson } from "./crm-salespersons.controller.js";

export const crmSalespersonsRouter = Router();

crmSalespersonsRouter.use(requireCrmAuth, blockSuperadminMutations);

crmSalespersonsRouter.get("/", requireCrmFullAccess, getSalesPeople);
crmSalespersonsRouter.post("/", requireCrmAdmin, postSalesPerson);
crmSalespersonsRouter.put("/:id", requireCrmAdmin, putSalesPerson);
