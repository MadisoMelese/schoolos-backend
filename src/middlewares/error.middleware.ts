import type { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import env from "../config/env.js";

/**
 * Standardized error response interface
 */
interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  stack?: string;
}

/**
 * Error codes for different error types
 */
const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  MONGOOSE_ERROR: 'MONGOOSE_ERROR',
} as const;

/**
 * Log error with structured format
 */
function logError(err: unknown, req: Request): void {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const userId = (req as any).user?._id || 'anonymous';
  
  console.error(`[${timestamp}] ${method} ${path} (User: ${userId})`);
  
  if (err instanceof Error) {
    console.error(`Error: ${err.name}: ${err.message}`);
    if (env.nodeEnv === 'development' && err.stack) {
      console.error(err.stack);
    }
  } else {
    console.error('Unknown error:', err);
  }
}

const errorMiddleware: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log the error
  logError(err, req);

  // Handle ApiError (our custom error class)
  if (err instanceof ApiError) {
    const response: ErrorResponse = {
      success: false,
      message: err.message,
      code: err.statusCode === 400 ? ErrorCodes.VALIDATION_ERROR :
             err.statusCode === 401 ? ErrorCodes.UNAUTHORIZED :
             err.statusCode === 403 ? ErrorCodes.FORBIDDEN :
             err.statusCode === 404 ? ErrorCodes.NOT_FOUND :
             err.statusCode === 409 ? ErrorCodes.CONFLICT :
             ErrorCodes.INTERNAL_ERROR,
    };
    
    if (env.nodeEnv === "development" && err.stack) {
      response.stack = err.stack;
    }
    
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle Mongoose validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    const details: Record<string, unknown> = {};
    for (const [field, error] of Object.entries(err.errors)) {
      details[field] = error.message;
    }
    
    const response: ErrorResponse = {
      success: false,
      message: 'Validation failed',
      code: ErrorCodes.VALIDATION_ERROR,
      details,
    };
    
    res.status(400).json(response);
    return;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    const response: ErrorResponse = {
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
      code: ErrorCodes.MONGOOSE_ERROR,
    };
    
    res.status(400).json(response);
    return;
  }

  // Handle MongoDB duplicate key error
  if (err instanceof Error && 'code' in err && (err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern || {})[0] || 'field';
    const response: ErrorResponse = {
      success: false,
      message: `Duplicate value for ${field}`,
      code: ErrorCodes.CONFLICT,
    };
    
    res.status(409).json(response);
    return;
  }

  // Handle JWT errors
  if (err instanceof Error && err.name === 'JsonWebTokenError') {
    const response: ErrorResponse = {
      success: false,
      message: 'Invalid token',
      code: ErrorCodes.UNAUTHORIZED,
    };
    
    res.status(401).json(response);
    return;
  }

  if (err instanceof Error && err.name === 'TokenExpiredError') {
    const response: ErrorResponse = {
      success: false,
      message: 'Token expired',
      code: ErrorCodes.UNAUTHORIZED,
    };
    
    res.status(401).json(response);
    return;
  }

  // Handle generic Error
  if (err instanceof Error) {
    const response: ErrorResponse = {
      success: false,
      message: env.nodeEnv === "development" ? err.message : "Internal Server Error",
      code: ErrorCodes.INTERNAL_ERROR,
    };
    
    if (env.nodeEnv === "development" && err.stack) {
      response.stack = err.stack;
    }
    
    res.status(500).json(response);
    return;
  }

  // Unknown error type
  const response: ErrorResponse = {
    success: false,
    message: "Internal Server Error",
    code: ErrorCodes.INTERNAL_ERROR,
  };
  
  res.status(500).json(response);
};

export default errorMiddleware;