import { Router } from "express";
import {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  deleteExam,
} from "../controllers/exam.controller.js";
import protect from "../middlewares/auth.middleware.js";
import loadSchoolReadScope from "../middlewares/schoolReadScope.middleware.js";
import adminOnly from "../middlewares/adminOnly.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createExamSchema,
  updateExamSchema,
} from "../validators/exam.validator.js";

const router = Router();

router.use(protect);
router.use(loadSchoolReadScope);

router.get("/", getAllExams);
router.get("/:id", getExamById);

router.post("/", adminOnly, validate(createExamSchema), createExam);
router.put("/:id", adminOnly, validate(updateExamSchema), updateExam);
router.delete("/:id", adminOnly, deleteExam);

export default router;