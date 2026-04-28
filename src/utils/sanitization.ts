/**
 * Input Sanitization Utilities
 * Prevent XSS, injection attacks, and clean user input
 */

/**
 * Sanitize string input by trimming and removing dangerous characters
 */
export function sanitizeString(input: string | undefined | null): string | undefined {
  if (!input) return undefined;
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Limit length to prevent abuse (default max 10,000 chars)
  if (sanitized.length > 10000) {
    sanitized = sanitized.slice(0, 10000);
  }
  
  return sanitized;
}

/**
 * Sanitize HTML content - escape dangerous characters
 */
export function sanitizeHtml(input: string | undefined | null): string | undefined {
  if (!input) return undefined;
  
  const sanitized = sanitizeString(input);
  if (!sanitized) return undefined;
  
  // Escape HTML entities
  return sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize object by sanitizing all string fields
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: { htmlFields?: string[] } = {}
): T {
  const result: Record<string, unknown> = {};
  const htmlFields = new Set(options.htmlFields || []);
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = htmlFields.has(key) 
        ? sanitizeHtml(value) 
        : sanitizeString(value);
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>, options);
    } else {
      result[key] = value;
    }
  }
  
  return result as T;
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string | undefined | null): string | undefined {
  if (!email) return undefined;
  
  const sanitized = email.trim().toLowerCase();
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return undefined;
  }
  
  // Limit length
  if (sanitized.length > 254) {
    return undefined;
  }
  
  return sanitized;
}

/**
 * Sanitize phone number - keep only digits and common separators
 */
export function sanitizePhone(phone: string | undefined | null): string | undefined {
  if (!phone) return undefined;
  
  // Keep only digits, spaces, dashes, parentheses, and plus sign
  const sanitized = phone.replace(/[^\d\s\-\(\)\+]/g, '').trim();
  
  // Limit length
  if (sanitized.length > 20) {
    return sanitized.slice(0, 20);
  }
  
  return sanitized || undefined;
}

/**
 * Sanitize URL - validate and clean
 */
export function sanitizeUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  
  const sanitized = url.trim();
  
  // Only allow http and https protocols
  try {
    const parsed = new URL(sanitized);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return undefined;
    }
    return sanitized;
  } catch {
    return undefined;
  }
}

/**
 * Sanitize filename - remove path traversal and dangerous characters
 */
export function sanitizeFilename(filename: string | undefined | null): string | undefined {
  if (!filename) return undefined;
  
  // Remove path separators and null bytes
  let sanitized = filename.replace(/[/\\:\0]/g, '');
  
  // Remove leading dots (hidden files, path traversal)
  sanitized = sanitized.replace(/^\.+/, '');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop() || '';
    const name = sanitized.slice(0, -(ext.length + 1));
    sanitized = name.slice(0, 250 - ext.length) + '.' + ext;
  }
  
  return sanitized || undefined;
}

/**
 * Strip HTML tags from string
 */
export function stripHtml(input: string | undefined | null): string | undefined {
  if (!input) return undefined;
  
  // Remove HTML tags
  return input.replace(/<[^>]*>/g, '').trim() || undefined;
}

/**
 * Sanitize search query for MongoDB regex
 * Escapes special regex characters to prevent ReDoS
 */
export function sanitizeRegex(input: string | undefined | null): string | undefined {
  if (!input) return undefined;
  
  // Escape special regex characters
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitize array of strings
 */
export function sanitizeArray(
  arr: (string | undefined | null)[] | undefined | null
): string[] | undefined {
  if (!arr || !Array.isArray(arr)) return undefined;
  
  const sanitized = arr
    .map(item => sanitizeString(item))
    .filter((item): item is string => item !== undefined);
  
  return sanitized.length > 0 ? sanitized : undefined;
}
