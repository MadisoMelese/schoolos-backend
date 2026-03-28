import { Router } from "express";
import {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass,
} from "../controllers/class.controller.js";
import protect from "../middlewares/auth.middleware.js";
import loadSchoolReadScope from "../middlewares/schoolReadScope.middleware.js";
import adminOnly from "../middlewares/adminOnly.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createClassSchema,
  updateClassSchema,
  addStudentToClassSchema,
} from "../validators/class.validator.js";

const router = Router();

router.use(protect);
router.use(loadSchoolReadScope);

router.get("/", getAllClasses);
router.get("/:id", getClassById);

router.post("/", adminOnly, validate(createClassSchema), createClass);
router.put("/:id", adminOnly, validate(updateClassSchema), updateClass);
router.delete("/:id", adminOnly, deleteClass);

router.post("/:id/students", adminOnly, validate(addStudentToClassSchema), addStudentToClass);
router.delete("/:id/students/:studentId", adminOnly, removeStudentFromClass);

export default router;