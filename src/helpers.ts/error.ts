import { AxiosError } from "axios";
import { Request, Response, NextFunction } from "express";

export const parseError = (
  error: unknown
): { message: string; metadata?: { [key: string]: unknown } } => {
  if (error instanceof AxiosError) {
    if (error.response) {
      return parseError(error.response.data);
    }
    return { message: error.message };
  }
  if (error instanceof Error) {
    console.error(error.stack);
    return { message: error.message };
  }
  if (typeof error === "string") {
    try {
      const parsedError = JSON.parse(error);
      if (parsedError.error) {
        return parseError(parsedError.error);
      }
      return {
        message: "An error occurred -- see metadata for details",
        metadata: parsedError,
      };
    } catch (e) {
      return { message: error };
    }
  }
  if (typeof error === "object" && error !== null) {
    const typecastedError = error as { [key: string]: unknown };
    if (typecastedError.error) {
      return parseError(typecastedError.error);
    }
    return {
      message: "An error occurred -- see metadata for details",
      metadata: error as { [key: string]: unknown },
    };
  }
  return { message: "An unknown error occurred" };
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({ error: parseError(error) });
      }
    }
  };
};
