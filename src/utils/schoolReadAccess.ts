import type { Types } from "mongoose";
import type { SchoolReadScope } from "../types/schoolReadScope.js";
import ApiError from "./ApiError.js";

export const assertSchoolDataAccess = (scope: SchoolReadScope): void => {
  if (scope.kind === "none") {
    throw new ApiError(
      403,
      "You do not have access to school data. Use an admin account or a user linked to a student or teacher profile.",
    );
  }
};

export const idInObjectIdList = (
  id: string,
  list: Types.ObjectId[],
): boolean => list.some((x) => x.toString() === id);
