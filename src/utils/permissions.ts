/**
 * Permission Service
 * Centralized permission checking for all resources
 */

import type { Types } from "mongoose";
import type { SchoolReadScope } from "../types/schoolReadScope.js";
import ApiError from "./ApiError.js";
import { idInObjectIdList } from "./schoolReadAccess.js";

/**
 * Resource types for permission checking
 */
export type ResourceType = 'student' | 'teacher' | 'class' | 'grade' | 'attendance' | 'fee' | 'exam' | 'message' | 'announcement';

/**
 * Action types
 */
export type ActionType = 'read' | 'write' | 'delete';

/**
 * Permission check result
 */
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if user can access a specific student
 */
export function canAccessStudent(
  scope: SchoolReadScope,
  studentId: string,
  action: ActionType = 'read'
): PermissionResult {
  // Admins can do everything
  if (scope.kind === 'admin') {
    return { allowed: true };
  }

  // Students can only access their own record
  if (scope.kind === 'student') {
    if (studentId === scope.studentDocId.toString()) {
      return { allowed: action === 'read' };
    }
    return { allowed: false, reason: 'Students can only access their own records' };
  }

  // Teachers can access students in their roster
  if (scope.kind === 'teacher') {
    if (idInObjectIdList(studentId, scope.rosterStudentIds)) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Student not in your class roster' };
  }

  return { allowed: false, reason: 'No access to student data' };
}

/**
 * Check if user can access a specific class
 */
export function canAccessClass(
  scope: SchoolReadScope,
  classId: string,
  action: ActionType = 'read'
): PermissionResult {
  // Admins can do everything
  if (scope.kind === 'admin') {
    return { allowed: true };
  }

  // Teachers can access classes they teach
  if (scope.kind === 'teacher') {
    if (idInObjectIdList(classId, scope.taughtClassIds)) {
      return { allowed: action === 'read' || action === 'write' };
    }
    return { allowed: false, reason: 'You do not teach this class' };
  }

  // Students can read classes they're enrolled in
  if (scope.kind === 'student') {
    if (idInObjectIdList(classId, scope.classIds)) {
      return { allowed: action === 'read' };
    }
    return { allowed: false, reason: 'You are not enrolled in this class' };
  }

  return { allowed: false, reason: 'No access to class data' };
}

/**
 * Check if user can access a specific grade
 */
export function canAccessGrade(
  scope: SchoolReadScope,
  studentId: string,
  teacherId?: string,
  action: ActionType = 'read'
): PermissionResult {
  // Admins can do everything
  if (scope.kind === 'admin') {
    return { allowed: true };
  }

  // Students can only read their own grades
  if (scope.kind === 'student') {
    if (studentId === scope.studentDocId.toString()) {
      return { allowed: action === 'read' };
    }
    return { allowed: false, reason: 'Students can only view their own grades' };
  }

  // Teachers can access grades for students in their roster
  if (scope.kind === 'teacher') {
    const studentInRoster = idInObjectIdList(studentId, scope.rosterStudentIds);
    const ownGrade = teacherId === scope.teacherDocId.toString();
    
    if (studentInRoster || ownGrade) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Grade not accessible' };
  }

  return { allowed: false, reason: 'No access to grade data' };
}

/**
 * Check if user can access attendance records
 */
export function canAccessAttendance(
  scope: SchoolReadScope,
  studentId: string,
  classId?: string,
  action: ActionType = 'read'
): PermissionResult {
  // Admins can do everything
  if (scope.kind === 'admin') {
    return { allowed: true };
  }

  // Students can only read their own attendance
  if (scope.kind === 'student') {
    if (studentId === scope.studentDocId.toString()) {
      return { allowed: action === 'read' };
    }
    return { allowed: false, reason: 'Students can only view their own attendance' };
  }

  // Teachers can manage attendance for students in their roster
  if (scope.kind === 'teacher') {
    if (idInObjectIdList(studentId, scope.rosterStudentIds)) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Student not in your class roster' };
  }

  return { allowed: false, reason: 'No access to attendance data' };
}

/**
 * Check if user can perform mutations (write/delete)
 */
export function canMutate(scope: SchoolReadScope): PermissionResult {
  if (scope.kind === 'admin' || scope.kind === 'teacher') {
    return { allowed: true };
  }
  return { allowed: false, reason: 'Only admins and teachers can modify records' };
}

/**
 * Assert permission and throw error if not allowed
 */
export function assertPermission(result: PermissionResult): void {
  if (!result.allowed) {
    throw new ApiError(403, result.reason || 'Access denied');
  }
}

/**
 * Higher-order function to check permissions for a resource
 */
export function withPermission<T>(
  scope: SchoolReadScope,
  checkFn: (scope: SchoolReadScope) => PermissionResult,
  action: () => Promise<T>
): Promise<T> {
  const result = checkFn(scope);
  assertPermission(result);
  return action();
}

/**
 * Filter list of IDs to only those accessible by the user
 */
export function filterAccessibleIds(
  scope: SchoolReadScope,
  ids: string[],
  resourceType: ResourceType
): string[] {
  return ids.filter(id => {
    let result: PermissionResult;
    
    switch (resourceType) {
      case 'student':
        result = canAccessStudent(scope, id, 'read');
        break;
      case 'class':
        result = canAccessClass(scope, id, 'read');
        break;
      default:
        result = { allowed: false };
    }
    
    return result.allowed;
  });
}
