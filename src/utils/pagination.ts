/**
 * Pagination Utilities
 * Provides both offset-based and cursor-based pagination
 */

import mongoose from "mongoose";

// Pagination limits
export const PAGINATION_LIMITS = {
  MIN_LIMIT: 1,
  MAX_LIMIT: 100,
  DEFAULT_LIMIT: 20,
} as const;

/**
 * Validate and normalize pagination parameters
 */
export function validatePagination(
  page?: number,
  limit?: number,
  cursor?: string
): {
  validatedPage: number;
  validatedLimit: number;
  skip: number;
} {
  // If cursor is provided, we're doing cursor-based pagination
  // page is ignored in cursor-based pagination
  
  const validatedLimit = Math.min(
    Math.max(limit || PAGINATION_LIMITS.DEFAULT_LIMIT, PAGINATION_LIMITS.MIN_LIMIT),
    PAGINATION_LIMITS.MAX_LIMIT
  );

  const validatedPage = Math.max(page || 1, 1);

  return {
    validatedPage,
    validatedLimit,
    skip: (validatedPage - 1) * validatedLimit,
  };
}

/**
 * Validate search query to prevent ReDoS attacks
 * Escapes special regex characters and limits length
 */
export function sanitizeSearchQuery(search?: string): string | undefined {
  if (!search) return undefined;
  
  // Limit search length to prevent abuse
  const maxLength = 100;
  const trimmed = search.slice(0, maxLength);
  
  // Escape special regex characters
  return trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build pagination metadata for response
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
} {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Cursor-based pagination helpers
 */
export interface CursorPaginationResult<T> {
  items: T[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
}

/**
 * Encode cursor from document ID and timestamp
 */
export function encodeCursor(id: string, timestamp: Date): string {
  return Buffer.from(`${id}:${timestamp.getTime()}`).toString('base64');
}

/**
 * Decode cursor to get document ID and timestamp
 */
export function decodeCursor(cursor: string): { id: string; timestamp: Date } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const [id, timestamp] = decoded.split(':');
    if (!id || !timestamp) return null;
    return {
      id,
      timestamp: new Date(parseInt(timestamp, 10)),
    };
  } catch {
    return null;
  }
}

/**
 * Build cursor-based query for MongoDB
 */
export function buildCursorQuery(
  cursor: string | undefined,
  sortField: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
): Record<string, unknown> {
  if (!cursor) return {};

  const decoded = decodeCursor(cursor);
  if (!decoded) return {};

  const operator = sortOrder === 'desc' ? '$lt' : '$gt';
  
  return {
    $or: [
      { [sortField]: { [operator]: decoded.timestamp } },
      {
        [sortField]: decoded.timestamp,
        _id: { [operator]: new mongoose.Types.ObjectId(decoded.id) },
      },
    ],
  };
}

/**
 * Field selection/projection utilities
 */
export function parseFields(fields?: string): Record<string, 0 | 1> | undefined {
  if (!fields) return undefined;

  const fieldList = fields.split(',').map(f => f.trim()).filter(Boolean);
  if (fieldList.length === 0) return undefined;

  const projection: Record<string, 0 | 1> = {};
  fieldList.forEach(field => {
    // Always include _id for consistency
    projection[field] = 1;
  });

  return projection;
}

/**
 * Common field projections for models
 */
export const CommonProjections = {
  student: {
    basic: { studentId: 1, firstName: 1, lastName: 1, status: 1 },
    full: { studentId: 1, firstName: 1, lastName: 1, status: 1, gender: 1, phone: 1, address: 1, parentName: 1, parentPhone: 1, parentEmail: 1 },
  },
  teacher: {
    basic: { teacherId: 1, firstName: 1, lastName: 1, subject: 1, status: 1 },
    full: { teacherId: 1, firstName: 1, lastName: 1, subject: 1, status: 1, phone: 1, email: 1 },
  },
  class: {
    basic: { name: 1, section: 1, grade: 1, status: 1 },
    full: { name: 1, section: 1, grade: 1, status: 1, capacity: 1, academicYear: 1 },
  },
  grade: {
    basic: { studentId: 1, subject: 1, marksObtained: 1, totalMarks: 1, grade: 1 },
  },
  attendance: {
    basic: { studentId: 1, date: 1, status: 1 },
  },
};
