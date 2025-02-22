import { AxiosError } from "axios";
import { Request, Response, NextFunction } from "express";
import { debug } from "../config";
import { FormattedError } from "../types/error";

export const parse_error = (error: unknown): FormattedError => {
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
      formatted_error = JSON.parse(error);
    } catch (e) {
      formatted_error = { message: error };
    }
  }
  if (typeof error === "object" && error !== null) {
    const typecasted_error = error as { [key: string]: unknown };
    if (typecasted_error.error) {
      formatted_error = parse_error(typecasted_error.error);
    }
    formatted_error.metadata = error as { [key: string]: unknown };
  }
  if (
    formatted_error.metadata?.code &&
    typeof formatted_error.metadata.code === "string"
  ) {
    formatted_error.message = formatted_error.metadata.code;
  }
  return {
    message: formatted_error.message,
    metadata: debug ? formatted_error.metadata : undefined,
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
