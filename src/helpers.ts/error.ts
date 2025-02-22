import { AxiosError } from "axios";
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

export const parse_error = (error: unknown): FormattedError => {
  if (error instanceof CustomError) {
    return {
      message: error.message,
      user_data: error.user_data ? error.user_data : undefined,
      debug_data:
        error.debug_data && show_debug_data ? error.debug_data : undefined,
    };
  }
  let formatted_error: FormattedError = {
    message: "An unknown error occurred",
  };
  if (error instanceof AxiosError) {
    if (error.response) {
      formatted_error = parse_error(error.response.data);
    }
    formatted_error = { message: error.message };
  }
  if (error instanceof Error) {
    formatted_error = { message: error.message };
  }
  if (typeof error === "string") {
    try {
      const json = JSON.parse(error);
      formatted_error = parse_error(json);
    } catch (e) {
      formatted_error = { message: error };
    }
  }
  if (typeof error === "object" && error !== null) {
    const typecasted_error = error as { [key: string]: unknown };
    if (typecasted_error.error) {
      formatted_error = parse_error(typecasted_error.error);
    }
    formatted_error.debug_data = error as { [key: string]: unknown };
  }
  if (
    formatted_error.debug_data?.code &&
    typeof formatted_error.debug_data.code === "string"
  ) {
    formatted_error.message = formatted_error.debug_data.code;
  }
  return {
    message: formatted_error.message,
    user_data: formatted_error.user_data
      ? formatted_error.user_data
      : undefined,
    debug_data:
      formatted_error.debug_data && show_debug_data
        ? formatted_error.debug_data
        : undefined,
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
