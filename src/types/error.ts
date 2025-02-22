export interface FormattedError {
  message: string;
  user_data?: { [key: string]: unknown };
  debug_data?: { [key: string]: unknown };
}
