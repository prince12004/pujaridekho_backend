import { Router } from "express";
import { requireCustomerAuth } from "../../middlewares/customer-auth.js";
import { getMyAddresses, patchMyAddress, postMyAddress, removeMyAddress } from "./account-addresses.controller.js";

export const accountAddressesRouter = Router();

accountAddressesRouter.use(requireCustomerAuth);
accountAddressesRouter.get("/", getMyAddresses);
accountAddressesRouter.post("/", postMyAddress);
accountAddressesRouter.patch("/:id", patchMyAddress);
accountAddressesRouter.delete("/:id", removeMyAddress);
