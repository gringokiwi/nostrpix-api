import axios from "axios";
import {
  sqalaBaseUrl,
  sqalaAppId,
  sqalaAppSecret,
  sqalaRefreshToken,
} from "../config";
import { encode } from "base-64";
import { processPixAmount, processPixKey } from "../helpers.ts/pix";

const sqalaApiClient = axios.create({
  baseURL: sqalaBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

sqalaApiClient.interceptors.request.use(async (config) => {
  if (config.url === "/access-tokens") {
    config.headers.Authorization =
      "Basic " + encode(sqalaAppId + ":" + sqalaAppSecret);
    return config;
  }
  try {
    const token = await getAccessToken();
    config.headers.Authorization = `Bearer ${token}`;
  } catch (error) {
    console.error("Error setting authentication header:", error);
  }
  return config;
});

let accessToken: string | null = null;
let tokenExpiryTime: number | null = null;

const getAccessToken = async (): Promise<string> => {
  if (accessToken && tokenExpiryTime && Date.now() < tokenExpiryTime) {
    return accessToken;
  }
  try {
    const response = await sqalaApiClient.post("/access-tokens", {
      refreshToken: sqalaRefreshToken,
    });
    accessToken = response.data.token as string;
    tokenExpiryTime = response.data.expiresIn as number;
    return accessToken;
  } catch (error) {
    throw error;
  }
};

export const topupAccount = async ({
  amountDecimal,
}: {
  amountDecimal: number;
}) => {
  const response = await sqalaApiClient.post(`/pix-qrcode-payments`, {
    amount: processPixAmount(amountDecimal),
  });
  return response.data.payload;
};

export const lookupPixQr = async (qrcode: string) => {
  const response = await sqalaApiClient.get(`/dict/barcode?qrcode=${qrcode}`);
  return response.data;
};

export const payStaticPix = async ({
  pixKey,
  amountDecimal,
}: {
  pixKey: string;
  amountDecimal: number;
}) => {
  const validatedPixKey = processPixKey(pixKey);
  const validatedAmountCents = processPixAmount(amountDecimal);
  const response = await sqalaApiClient.post(
    `/recipients/DEFAULT/withdrawals`,
    {
      method: "PIX",
      amount: validatedAmountCents,
      pixKey: validatedPixKey,
    }
  );
  return response.data;
};
