import { Router } from "express";
import {
  createAdminSchoolSiteContent,
  deleteAdminSchoolSiteContent,
  listAdminSchoolSiteContent,
  listPublicSchoolSiteContent,
  updateAdminSchoolSiteContent,
} from "../controllers/schoolSiteContent.controller.js";
import protect from "../middlewares/auth.middleware.js";
import adminOnly from "../middlewares/adminOnly.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createSchoolSiteContentSchema,
  schoolSiteListQuerySchema,
  updateSchoolSiteContentSchema,
} from "../validators/schoolSiteContent.validator.js";

const router = Router();

router.get(
  "/admin",
  protect,
  adminOnly,
  validate(schoolSiteListQuerySchema, "query"),
  listAdminSchoolSiteContent,
);
router.post(
  "/admin",
  protect,
  adminOnly,
  validate(createSchoolSiteContentSchema),
  createAdminSchoolSiteContent,
);
router.put(
  "/admin/:id",
  protect,
  adminOnly,
  validate(updateSchoolSiteContentSchema),
  updateAdminSchoolSiteContent,
);
router.delete(
  "/admin/:id",
  protect,
  adminOnly,
  deleteAdminSchoolSiteContent,
);

router.get("/:section", listPublicSchoolSiteContent);

export default router;
