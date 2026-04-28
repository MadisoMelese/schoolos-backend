import { z } from "zod";

/**
 * Common Query Parameter Validation
 * Reusable schemas for pagination, filtering, and sorting
 */

// Pagination schema with bounds checking
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 1;
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 1) return 1;
      if (num > 10000) return 10000; // Max page to prevent abuse
      return num;
    }),
  
  limit: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 20;
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 1) return 20;
      if (num > 100) return 100; // Max limit
      return num;
    }),
  
  // Cursor for cursor-based pagination
  cursor: z.string().optional(),
  
  // Field selection
  fields: z.string().optional(),
  
  // Sort field
  sortBy: z.string().optional(),
  
  // Sort order
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Search query schema with sanitization
export const searchSchema = z.object({
  search: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      // Limit length
      const trimmed = val.slice(0, 100);
      // Escape special regex characters for safety
      return trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }),
});

// Status filter schema
export const statusFilterSchema = z.object({
  status: z.string().optional(),
});

// Date range filter schema
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ID parameter validation
export const idParamSchema = z.object({
  id: z.string().min(1, "ID is required").refine(
    (val) => /^[0-9a-fA-F]{24}$/.test(val) || val === 'me',
    { message: "Invalid ID format" }
  ),
});

// ObjectId validation
export const objectIdSchema = z.string().refine(
  (val) => /^[0-9a-fA-F]{24}$/.test(val),
  { message: "Invalid ObjectId format" }
);

// Combined query schema for list endpoints
export const listQuerySchema = paginationSchema.merge(searchSchema).merge(statusFilterSchema);

// Type inference
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type ListQueryInput = z.infer<typeof listQuerySchema>;

/**
 * Validate and parse query parameters
 */
export function parseListQuery(query: Record<string, unknown>): ListQueryInput {
  return listQuerySchema.parse(query);
}

/**
 * Validate ObjectId format
 */
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Validate multiple ObjectIds
 */
export function validateObjectIds(ids: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];
  
  for (const id of ids) {
    if (isValidObjectId(id)) {
      valid.push(id);
    } else {
      invalid.push(id);
    }
  }
  
  return { valid, invalid };
}
