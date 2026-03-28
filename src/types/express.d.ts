import type { IUserDocument } from "../models/User.model.js";
import type { SchoolReadScope } from "./schoolReadScope.js";

declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
      schoolReadScope?: SchoolReadScope;
    }
  }
}