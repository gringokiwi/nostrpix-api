import dotenv from "dotenv";
dotenv.config();

export const port = process.env.PORT || 3001;
export const sqala_base_url = process.env.SQALA_BASE_URL;
export const sqala_app_id = process.env.SQALA_APP_ID;
export const sqala_app_secret = process.env.SQALA_APP_SECRET;
export const sqala_refresh_token = process.env.SQALA_REFRESH_TOKEN;
export const supabase_url = process.env.SUPABASE_URL as string;
export const supabase_key = process.env.SUPABASE_KEY as string;
export const strike_base_url = process.env.STRIKE_BASE_URL;
export const strike_api_key = process.env.STRIKE_API_KEY;
export const show_debug_data = process.env.SHOW_DEBUG_DATA === "true" || false;
