import { AxiosError, AxiosResponse } from "axios";
import { Request, Response, NextFunction } from "express";
import { show_debug_data } from "../config";
import { FormattedError } from "../types/error";

export class CustomError extends Error {
  user_data?: { [key: string]: unknown };
  debug_data?: { [key: string]: unknown };
  constructor(
    message: FormattedError["message"],
    user_data?: FormattedError["user_data"],
    debug_data?: FormattedError["debug_data"]
  ) {
    super(message);
    this.name = "CustomError";
    this.user_data = user_data;
    this.debug_data = debug_data;
  }
}

const errorToDebugObject = (error: Error): { [key: string]: unknown } => {
  return Object.getOwnPropertyNames(error).reduce((acc, key) => {
    acc[key] = error[key as keyof Error];
    return acc;
  }, {} as { [key: string]: unknown });
};

export const parse_error = (error: unknown): FormattedError => {
  console.error(error);

  // Handle CustomError directly
  if (error instanceof CustomError) {
    return {
      message: error.message,
      user_data: error.user_data,
      debug_data: show_debug_data ? error.debug_data : undefined,
    };
  }

  // Handle Axios errors
  if (error instanceof AxiosError) {
    return parse_error(error.response?.data || error.message);
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      message: error.message,
      debug_data: show_debug_data ? errorToDebugObject(error) : undefined,
    };
  }

  // Handle string errors (possibly JSON)
  if (typeof error === "string") {
    try {
      return parse_error(JSON.parse(error));
    } catch {
      return {
        message: error,
      };
    }
  }

  // Handle object errors
  if (typeof error === "object" && error !== null) {
    const typecasted_error = error as { [key: string]: unknown };

    // Handle nested errors
    if (typecasted_error.error) {
      return parse_error(typecasted_error.error);
    }

    // Handle Axios-like responses
    if (typecasted_error.response) {
      return parse_error((typecasted_error.response as AxiosResponse).data);
    }

    // Use 'code' as message if available
    const message =
      typeof typecasted_error.code === "string"
        ? typecasted_error.code
        : "An unknown error occurred";

    return {
      message,
      debug_data: show_debug_data ? typecasted_error : undefined,
    };
  }

  // Default case
  return {
    message: "An unknown error occurred",
    debug_data: show_debug_data ? { original: error } : undefined,
  };
};

export const async_handler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({ error: parse_error(error) });
      }
    }
  };
};
