import dotenv from "dotenv";

dotenv.config();

export const port = process.env.PORT || 3000;
export const sqalaBaseUrl = process.env.SQALA_BASE_URL;
export const sqalaAppId = process.env.SQALA_APP_ID;
export const sqalaAppSecret = process.env.SQALA_APP_SECRET;
export const sqalaRefreshToken = process.env.SQALA_REFRESH_TOKEN;
